"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DrillPhase =
  | "idle"
  | "countdown"
  | "armed"
  | "timing"
  | "success"
  | "break-before-grade"
  | "finished";

export type DrillTimerOptions = {
  countdownSeconds?: number;
  breakSeconds?: number;
  onCountdownComplete?: () => void;
  onStartTiming?: () => void;
  onSuccess?: (elapsedMs: number) => void;
  onBreakComplete?: () => void;
  onFinish?: () => void;
};

/**
 * Generic drill timer state machine.
 *
 * Drives the lifecycle of a single drill attempt:
 *   idle -> countdown -> armed -> timing -> success -> break -> finished
 *
 * The consumer is responsible for detecting MIDI events and calling
 * `arm()` (hands lifted) and `markSuccess()` (correct input detected).
 */
export function useDrillTimer(options: DrillTimerOptions = {}) {
  const {
    countdownSeconds = 0,
    breakSeconds = 0,
    onCountdownComplete,
    onStartTiming,
    onSuccess,
    onBreakComplete,
    onFinish,
  } = options;

  const [phase, setPhase] = useState<DrillPhase>("idle");
  const phaseRef = useRef<DrillPhase>("idle");
  const [liveMs, setLiveMs] = useState<number>(0);
  const [countdownValue, setCountdownValue] = useState<number>(0);
  const [breakRemaining, setBreakRemaining] = useState<number>(0);

  const readyTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setPhaseSync = useCallback((next: DrillPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const clearBreak = useCallback(() => {
    if (breakIntervalRef.current !== null) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }
  }, []);

  const startTimingLoop = useCallback(() => {
    clearRaf();
    readyTimeRef.current = performance.now();

    const tick = () => {
      if (readyTimeRef.current !== null) {
        setLiveMs(performance.now() - readyTimeRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [clearRaf]);

  const stopTimingLoop = useCallback(() => {
    clearRaf();
    readyTimeRef.current = null;
  }, [clearRaf]);

  const start = useCallback(() => {
    if (countdownSeconds > 0) {
      setPhaseSync("countdown");
      setCountdownValue(countdownSeconds);
      clearCountdown();

      countdownIntervalRef.current = setInterval(() => {
        setCountdownValue((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearCountdown();
            setPhaseSync("armed");
            onCountdownComplete?.();
          }
          return Math.max(0, next);
        });
      }, 1000);
    } else {
      setPhaseSync("armed");
    }
  }, [countdownSeconds, clearCountdown, onCountdownComplete, setPhaseSync]);

  const arm = useCallback(() => {
    if (phaseRef.current !== "armed" && phaseRef.current !== "success") return;
    setPhaseSync("timing");
    setLiveMs(0);
    startTimingLoop();
    onStartTiming?.();
  }, [startTimingLoop, onStartTiming, setPhaseSync]);

  const markSuccess = useCallback(() => {
    if (phaseRef.current !== "timing") return;

    const elapsed = readyTimeRef.current !== null
      ? performance.now() - readyTimeRef.current
      : 0;

    stopTimingLoop();
    setLiveMs(elapsed);
    onSuccess?.(elapsed);

    if (breakSeconds > 0) {
      setPhaseSync("break-before-grade");
      setBreakRemaining(breakSeconds);
      clearBreak();

      breakIntervalRef.current = setInterval(() => {
        setBreakRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            clearBreak();
            setPhaseSync("finished");
            onBreakComplete?.();
            onFinish?.();
          }
          return Math.max(0, next);
        });
      }, 1000);
    } else {
      setPhaseSync("finished");
      onFinish?.();
    }
  }, [breakSeconds, stopTimingLoop, onSuccess, clearBreak, onBreakComplete, onFinish, setPhaseSync]);

  const cancel = useCallback(() => {
    clearCountdown();
    clearBreak();
    stopTimingLoop();
    setCountdownValue(0);
    setBreakRemaining(0);
    setLiveMs(0);
    setPhaseSync("idle");
  }, [clearCountdown, clearBreak, stopTimingLoop, setPhaseSync]);

  const reset = useCallback(() => {
    cancel();
  }, [cancel]);

  // Clean up all timers and animation frames on unmount.
  useEffect(() => {
    return () => {
      clearCountdown();
      clearBreak();
      clearRaf();
    };
  }, [clearCountdown, clearBreak, clearRaf]);

  return {
    phase,
    liveMs,
    countdownValue,
    breakRemaining,
    start,
    arm,
    markSuccess,
    cancel,
    reset,
  };
}
