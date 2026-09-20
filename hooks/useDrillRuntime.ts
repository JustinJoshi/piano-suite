"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDrillTimer } from "@/hooks/useDrillTimer";
import { useMidi } from "@/hooks/useMidi";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { evaluateChordAttempt } from "@/lib/scoring";
import { gradeForMisses } from "@/lib/sequence-drill";
import {
  appendLocalWorkshopEvent,
  appendLocalWorkshopMiss,
} from "@/lib/local-practice-history";
import { captureEvent } from "@/lib/analytics";
import { buildStream } from "@/lib/feature-blocks/build-stream";
import {
  beatsToMs,
  rampedBpm,
} from "@/lib/feature-blocks/transport/clock";
import type {
  ChordTarget,
  DrillPhase,
  DrillRuntimeConfig,
} from "@/lib/drill-runtime";
import { sourcePracticeCapable } from "@/lib/stream-practice";
import {
  streamTargetsIdentity,
  targetsFromStream,
} from "@/lib/stream-targets";
import type { TransportConfig } from "@/lib/feature-blocks/transport/config";
import type { PracticeNote } from "@/lib/practice-note";

function emitAnalytics(name: "drill_started" | "drill_completed", pageId: string) {
  captureEvent(name, pageId ? { pageId } : {});
}

export type DrillRuntimeOptions = {
  pageId?: string;
  /** Page blocks; their sources compose the runtime's stream. */
  blocks?: Array<{ id: string; type: string; config: unknown }>;
} & Partial<DrillRuntimeConfig>;

type RampSettings = {
  enabled: boolean;
  targetBpm: number;
  overReps: number;
};

const NO_RAMP: RampSettings = {
  enabled: false,
  targetBpm: 0,
  overReps: 8,
};

const DEFAULT_GRADE_THRESHOLDS = { good: 0, hard: 2 };

export function useDrillRuntimeProvider(options: DrillRuntimeOptions = {}) {
  const {
    pageId = "",
    blocks,
    clock = null,
    countdownSeconds = 3,
    breakSeconds = 5,
    multiRep = true,
    requireExact = false,
    goodThreshold = DEFAULT_GRADE_THRESHOLDS.good,
    hardThreshold = DEFAULT_GRADE_THRESHOLDS.hard,
  } = options;

  // The transport block's ramp settings, resolved once per options change.
  // Ramping derives the effective bpm from the runtime's completed reps
  // (`targetIndex`, reset on start/reset) rather than widening DrillClock.
  const ramp = useMemo<RampSettings>(() => {
    const transportBlock = blocks?.find((b) => b.type === "transport");
    if (!transportBlock) return NO_RAMP;
    const config = transportBlock.config as Partial<TransportConfig> | null;
    return {
      enabled: config?.rampEnabled === true,
      targetBpm: typeof config?.rampTargetBpm === "number" ? config.rampTargetBpm : 0,
      overReps: typeof config?.rampOverReps === "number" ? config.rampOverReps : 8,
    };
  }, [blocks]);

  const [targets, setTargetsState] = useState<ChordTarget[]>([]);
  // Ordered list of mounted target blocks. The head owns `setTargets`; see
  // `lib/feature-blocks/target-blocks.ts` for why a page has only one owner.
  const [targetSources, setTargetSources] = useState<string[]>([]);
  // Runtime source blocks' notes by block id: the uploaded-piece channel into
  // the composed stream. Reference-compared on write so re-registering the
  // same notes never loops.
  const [runtimeNotes, setRuntimeNotes] = useState<
    ReadonlyMap<string, PracticeNote[]>
  >(new Map());
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
  const thresholdsRef = useRef({ good: goodThreshold, hard: hardThreshold });

  useEffect(() => {
    logPracticeEventRef.current = logPracticeEventMutation;
    logMissEventRef.current = logMissEventMutation;
    canPersistRef.current = canPersist;
    pageIdRef.current = pageId;
    missesRef.current = misses;
    thresholdsRef.current = { good: goodThreshold, hard: hardThreshold };
  });

  const logSuccess = useCallback((elapsedMs: number) => {
    const target = currentTargetRef.current;
    const id = pageIdRef.current;
    if (!target || !id) return;

    // Miss-count grading — the chord-set settings editor exposes these
    // thresholds as "max misses for a Good/Hard grade".
    const gradeResult = gradeForMisses(
      missesRef.current,
      thresholdsRef.current
    );

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
    multiRep,
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

  const registerTargetSource = useCallback((ownerKey: string) => {
    setTargetSources((prev) => [...prev, ownerKey]);
    return () => {
      setTargetSources((prev) => {
        // Remove one occurrence, not every match: two blocks of the same type
        // register the same key.
        const index = prev.indexOf(ownerKey);
        if (index === -1) return prev;
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      });
    };
  }, []);

  const activeTargetSource = targetSources[0] ?? null;

  const setRuntimeSourceNotes = useCallback(
    (blockId: string, notes: PracticeNote[]) => {
      setRuntimeNotes((prev) => {
        if (prev.get(blockId) === notes) return prev;
        const next = new Map(prev);
        next.set(blockId, notes);
        return next;
      });
    },
    []
  );

  const clearRuntimeSourceNotes = useCallback((blockId: string) => {
    setRuntimeNotes((prev) => {
      if (!prev.has(blockId)) return prev;
      const next = new Map(prev);
      next.delete(blockId);
      return next;
    });
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

  // The effective tempo: the configured bpm while the ramp is off, otherwise
  // ramped from it toward the target over completed reps (targetIndex resets
  // on start/reset). Both timing consumers below use this one value.
  const effectiveBpm = ramp.enabled && clock
    ? rampedBpm(clock.bpm, ramp.targetBpm, targetIndex, ramp.overReps)
    : clock?.bpm;

  const beatsPerBar = clock?.beatsPerBar ?? 4;

  // The page's composed stream, memoised on the blocks array the same way
  // runtimeOptionsFromBlocks memoises the config. A transport block's tempo
  // and meter drive transform timing; pages without one use the composer's
  // defaults.
  const stream = useMemo(
    () => buildStream(blocks ?? [], effectiveBpm, runtimeNotes, beatsPerBar),
    [blocks, effectiveBpm, runtimeNotes, beatsPerBar]
  );

  // Source-only practice: a page with a display/timer/transport but no
  // explicit target block grades itself against the stream. The transport's
  // tempo ramp rebuilds `stream` on every rep, so application is keyed on the
  // targets' logical identity — pitch classes and labels only — never on the
  // array itself; a re-timing alone must not reset targetIndex or misses.
  const fallbackCapable = sourcePracticeCapable(blocks ?? [], pageId);
  const appliedFallbackIdentityRef = useRef<string | null>(null);
  useEffect(() => {
    if (!fallbackCapable) {
      if (appliedFallbackIdentityRef.current !== null) {
        appliedFallbackIdentityRef.current = null;
        setTargetsState([]);
        setTargetIndex(0);
        setMisses(0);
        missReportedRef.current = false;
      }
      return;
    }

    const nextTargets = targetsFromStream(stream);
    const identity = streamTargetsIdentity(nextTargets);
    if (identity === appliedFallbackIdentityRef.current) return;
    appliedFallbackIdentityRef.current = identity;
    setTargetsState(nextTargets);
    setTargetIndex(0);
    setMisses(0);
    missReportedRef.current = false;
  }, [fallbackCapable, stream]);

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

  // Clock-advanced pages: the transport owns progression. Each target gets
  // one bar; when the bar closes on an unmet target, the late (or absent)
  // note counts as a miss and the clock moves on. Pages without a transport
  // never enter this effect — their path is unchanged. Neither do pages
  // without targets: there is nothing to advance and nothing to miss, so the
  // clock must not run the page out to finishNow().
  useEffect(() => {
    if (!clock || timer.phase !== "timing" || targets.length === 0) return;

    const windowMs = beatsToMs(clock.beatsPerBar, effectiveBpm ?? clock.bpm);
    const interval = setInterval(() => {
      const target = currentTargetRef.current;

      if (target) {
        logMiss(target, new Set());
        setMisses((prev) => prev + 1);
      }

      if (targetIndexRef.current + 1 >= targetsLengthRef.current) {
        timerRef.current?.finishNow();
        return;
      }
      setTargetIndex((prev) => prev + 1);
    }, windowMs);

    return () => clearInterval(interval);
  }, [clock, effectiveBpm, timer.phase, targetIndex, targets.length, logMiss]);

  // useDrillTimer requires an explicit arm() call to leave "armed" (see its
  // header comment: "the consumer is responsible for ... calling arm() (hands
  // lifted)") so a chord still held from the previous rep can't immediately
  // re-trigger scoring. Only lifting all keys starts the clock.
  useEffect(() => {
    if (timer.phase === "armed" && heldPcs.size === 0) {
      timer.arm();
    }
  }, [timer, heldPcs]);

  return useMemo(
    () => ({
      pageId,
      phase: timer.phase,
      liveMs: timer.liveMs,
      countdownValue: timer.countdownValue,
      breakRemaining: timer.breakRemaining,
      currentTarget,
      targets,
      targetIndex,
      totalTargets: targets.length,
      misses,
      stream,
      start,
      reset,
      setTargets,
      skipTarget,
      registerTargetSource,
      activeTargetSource,
      setRuntimeSourceNotes,
      clearRuntimeSourceNotes,
    }),
    [
      timer.phase,
      timer.liveMs,
      timer.countdownValue,
      timer.breakRemaining,
      currentTarget,
      targets,
      targetIndex,
      misses,
      stream,
      start,
      reset,
      setTargets,
      skipTarget,
      pageId,
      registerTargetSource,
      activeTargetSource,
      setRuntimeSourceNotes,
      clearRuntimeSourceNotes,
    ]
  );
}
