"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDrillTimer } from "@/hooks/useDrillTimer";
import { useMidi } from "@/hooks/useMidi";
import { evaluateChordAttempt } from "@/lib/scoring";
import type { ChordTarget, DrillPhase } from "@/lib/drill-runtime";

export type DrillRuntimeOptions = {
  countdownSeconds?: number;
  breakSeconds?: number;
  requireExact?: boolean;
};

export function useDrillRuntimeProvider(options: DrillRuntimeOptions = {}) {
  const {
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

  const { heldPcs } = useMidi();

  const onSuccess = useCallback(() => {
    if (targetIndexRef.current + 1 >= targetsLengthRef.current) {
      timerRef.current?.finishRound();
      return;
    }
    setTargetIndex((prev) => prev + 1);
    timerRef.current?.nextRep();
  }, []);

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

  // Reset miss-report flag whenever we enter timing for a new target.
  const phaseRef = useRef<DrillPhase>("idle");
  useEffect(() => {
    if (timer.phase === "timing" && phaseRef.current !== "timing") {
      missReportedRef.current = false;
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
    }
  }, [heldPcs, currentTarget, timer, requireExact]);

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
