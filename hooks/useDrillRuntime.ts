"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDrillTimer } from "@/hooks/useDrillTimer";
import { useMidi } from "@/hooks/useMidi";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { evaluateChordAttempt } from "@/lib/scoring";
import { gradeForTime } from "@/lib/chord-drill";
import {
  appendLocalWorkshopEvent,
  appendLocalWorkshopMiss,
} from "@/lib/local-practice-history";
import { captureEvent } from "@/lib/analytics";
import type { ChordTarget, DrillPhase } from "@/lib/drill-runtime";

function emitAnalytics(name: "drill_started" | "drill_completed", pageId: string) {
  captureEvent(name, pageId ? { pageId } : {});
}

export type DrillRuntimeOptions = {
  pageId?: string;
  countdownSeconds?: number;
  breakSeconds?: number;
  requireExact?: boolean;
};

const DEFAULT_GRADE_THRESHOLDS = { good: 2000, hard: 4000 };

export function useDrillRuntimeProvider(options: DrillRuntimeOptions = {}) {
  const {
    pageId = "",
    countdownSeconds = 3,
    breakSeconds = 5,
    requireExact = false,
  } = options;

  const [targets, setTargetsState] = useState<ChordTarget[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [misses, setMisses] = useState(0);
  const missReportedRef = useRef(false);

  const targetIndexRef = useRef(targetIndex);
  const targetsLengthRef = useRef(targets.length);
  const timerRef = useRef<ReturnType<typeof useDrillTimer> | null>(null);
  const currentTargetRef = useRef<ChordTarget | null>(null);

  const { heldPcs } = useMidi();
  const { canPersist } = useAuthAccess();
  const logPracticeEventMutation = useMutation(api.tracking.logPracticeEvent);
  const logMissEventMutation = useMutation(api.tracking.logMissEvent);

  const logPracticeEventRef = useRef(logPracticeEventMutation);
  const logMissEventRef = useRef(logMissEventMutation);
  const canPersistRef = useRef(canPersist);
  const pageIdRef = useRef(pageId);
  const missesRef = useRef(misses);

  useEffect(() => {
    logPracticeEventRef.current = logPracticeEventMutation;
    logMissEventRef.current = logMissEventMutation;
    canPersistRef.current = canPersist;
    pageIdRef.current = pageId;
    missesRef.current = misses;
  });

  const logSuccess = useCallback((elapsedMs: number) => {
    const target = currentTargetRef.current;
    const id = pageIdRef.current;
    if (!target || !id) return;

    const gradeResult = gradeForTime(elapsedMs, DEFAULT_GRADE_THRESHOLDS);

    if (canPersistRef.current) {
      logPracticeEventRef.current({
        tool: "workshop",
        chord: target.symbol,
        reactionTimeMs: Math.round(elapsedMs),
        grade: gradeResult.label,
        redo: false,
        pageId: id,
      }).catch((err) => {
        console.error("Failed to log workshop practice event", err);
      });
    } else {
      appendLocalWorkshopEvent({
        pageId: id,
        target: target.symbol,
        reactionTimeMs: Math.round(elapsedMs),
        misses: missesRef.current,
        grade: gradeResult.label,
      });
    }
  }, []);

  const logMiss = useCallback((target: ChordTarget, played: Set<number>) => {
    const id = pageIdRef.current;
    if (!id) return;

    const playedString = [...played].sort((a, b) => a - b).join(",");

    if (canPersistRef.current) {
      logMissEventRef.current({
        tool: "workshop",
        chord: target.symbol,
        played: playedString,
        pageId: id,
      }).catch((err) => {
        console.error("Failed to log workshop miss event", err);
      });
    } else {
      appendLocalWorkshopMiss({
        pageId: id,
        target: target.symbol,
        played: playedString,
      });
    }
  }, []);

  const onSuccess = useCallback(
    (elapsedMs: number) => {
      logSuccess(elapsedMs);

      if (targetIndexRef.current + 1 >= targetsLengthRef.current) {
        timerRef.current?.finishRound();
        return;
      }
      setTargetIndex((prev) => prev + 1);
      timerRef.current?.nextRep();
    },
    [logSuccess]
  );

  const timer = useDrillTimer({
    countdownSeconds,
    breakSeconds,
    multiRep: true,
    onSuccess,
  });

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);
  useEffect(() => {
    targetIndexRef.current = targetIndex;
  }, [targetIndex]);
  useEffect(() => {
    targetsLengthRef.current = targets.length;
  }, [targets.length]);

  const setTargets = useCallback((nextTargets: ChordTarget[]) => {
    setTargetsState(nextTargets);
    setTargetIndex(0);
    setMisses(0);
    missReportedRef.current = false;
  }, []);

  const start = useCallback(() => {
    setTargetIndex(0);
    setMisses(0);
    missReportedRef.current = false;
    emitAnalytics("drill_started", pageIdRef.current);
    timer.start();
  }, [timer]);

  const reset = useCallback(() => {
    setTargetIndex(0);
    setMisses(0);
    missReportedRef.current = false;
    timer.cancel();
  }, [timer]);

  const skipTarget = useCallback(() => {
    if (targetIndex + 1 >= targets.length) {
      timer.finishRound();
      return;
    }
    setTargetIndex((prev) => prev + 1);
  }, [targetIndex, targets.length, timer]);

  const currentTarget = targets[targetIndex] ?? null;

  useEffect(() => {
    currentTargetRef.current = currentTarget;
  }, [currentTarget]);

  // Reset miss-report flag on timing entry; emit completion on finished entry.
  const phaseRef = useRef<DrillPhase>("idle");
  useEffect(() => {
    if (timer.phase === "timing" && phaseRef.current !== "timing") {
      missReportedRef.current = false;
    }
    if (timer.phase === "finished" && phaseRef.current !== "finished") {
      emitAnalytics("drill_completed", pageIdRef.current);
    }
    phaseRef.current = timer.phase;
  }, [timer.phase]);

  // Score held notes against the current target while timing.
  useEffect(() => {
    if (timer.phase !== "timing" || !currentTarget) return;

    const result = evaluateChordAttempt(currentTarget.pcs, heldPcs, {
      requireExact,
    });

    if (result.correct) {
      timer.markSuccess();
      return;
    }

    if (heldPcs.size > 0 && !missReportedRef.current) {
      missReportedRef.current = true;
      setMisses((prev) => prev + 1);
      if (currentTarget) {
        logMiss(currentTarget, heldPcs);
      }
    }
  }, [heldPcs, currentTarget, timer, requireExact, logMiss]);

  return useMemo(
    () => ({
      phase: timer.phase,
      liveMs: timer.liveMs,
      countdownValue: timer.countdownValue,
      breakRemaining: timer.breakRemaining,
      currentTarget,
      targetIndex,
      totalTargets: targets.length,
      misses,
      start,
      reset,
      setTargets,
      skipTarget,
    }),
    [
      timer.phase,
      timer.liveMs,
      timer.countdownValue,
      timer.breakRemaining,
      currentTarget,
      targetIndex,
      targets.length,
      misses,
      start,
      reset,
      setTargets,
      skipTarget,
    ]
  );
}
