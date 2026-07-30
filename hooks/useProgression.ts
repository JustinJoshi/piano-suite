"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMidi } from "@/hooks/useMidi";
import { useAudio } from "@/hooks/useAudio";
import { useProgressionSettings } from "@/hooks/useProgressionSettings";
import {
  type Root,
  ROOTS,
  type Quality,
  buildPitchClassSet,
} from "@/lib/music-theory";
import { evaluateChordAttempt } from "@/lib/scoring";
import { flipCurrentCard, pingAnki } from "@/lib/anki";
import {
  type Progression,
  type ProgressionType,
  type ProgressionHistoryEntry,
  buildProgression,
  chordSymbol,
  historyKey,
  updateProgressionHistory,
} from "@/lib/progression";
import { appendLocalProgressionEvent } from "@/lib/local-practice-history";

export type ProgressionPhase = "idle" | "armed" | "timing" | "success";

export type ProgressionEngine = {
  // MIDI
  midiSupported: boolean;
  midiConnected: boolean;
  midiInputs: { id: string; name: string }[];
  selectedInputId: string | null;
  setSelectedInputId: (id: string) => void;
  connectMidi: () => Promise<void>;
  heldNotes: number[];

  // Progression selection
  progressionType: ProgressionType;
  setProgressionType: (type: ProgressionType) => void;
  keyRoot: Root;
  setKeyRoot: (root: Root) => void;
  progression: Progression;
  currentStep: {
    label: string;
    root: Root;
    quality: Quality;
    symbol: string;
    scale: string;
    targetPcs: Set<number>;
  };
  stepIdx: number;
  loopCount: number;

  // Drill state
  phase: ProgressionPhase;
  liveMs: number;
  running: boolean;
  startDrill: () => void;
  stopDrill: () => void;

  // Stats
  stats: ProgressionHistoryEntry | undefined;
  resetStats: () => void;

  // Settings
  ankiFlip: boolean;
  setAnkiFlip: (v: boolean) => void;
  stepChime: boolean;
  setStepChime: (v: boolean) => void;
  loopChime: boolean;
  setLoopChime: (v: boolean) => void;

  // Anki
  ankiStatus: string;
};

/**
 * Compose the primitive hooks into a complete looping progression drill engine.
 */
export function useProgression(enabled: boolean): ProgressionEngine {
  const { settings, history, updateSettings, updateHistory } =
    useProgressionSettings(enabled);

  const {
    supported: midiSupported,
    connected: midiConnected,
    inputs: midiInputs,
    selectedInputId,
    setSelectedInputId,
    heldNotes,
    connect: connectMidi,
  } = useMidi();

  const { playChime } = useAudio();
  const logEventMutation = useMutation(api.tracking.logProgressionEvent);
  const logEvent = useCallback(
    (args: Parameters<typeof logEventMutation>[0]) => {
      if (enabled) return logEventMutation(args);
      appendLocalProgressionEvent({
        progression: args.progression,
        key: args.key,
        stepLabel: args.stepLabel,
        chord: args.chord,
        reactionTimeMs: args.reactionTimeMs,
      });
      return Promise.resolve(undefined);
    },
    [enabled, logEventMutation]
  );

  // -------------------------------------------------------------------------
  // Refs for callbacks (avoid stale closures in the MIDI handler)
  // -------------------------------------------------------------------------
  const settingsRef = useRef(settings);
  const historyRef = useRef(history);
  const logEventRef = useRef(logEvent);
  const progressionRef = useRef<Progression | null>(null);
  const phaseRef = useRef<ProgressionPhase>("idle");
  const stepIdxRef = useRef(0);
  const loopCountRef = useRef(0);
  const stepTimesRef = useRef<number[]>([]);
  const readyTimeRef = useRef<number | null>(null);
  const liveRafRef = useRef<number | null>(null);
  const ankiFlipRef = useRef(false);
  const heldPcSetRef = useRef(new Set<number>());

  useEffect(() => {
    settingsRef.current = settings;
    historyRef.current = history;
    logEventRef.current = logEvent;
    ankiFlipRef.current = settings.ankiFlip;
  });

  // -------------------------------------------------------------------------
  // Local drill state
  // -------------------------------------------------------------------------
  const [phase, setPhaseState] = useState<ProgressionPhase>("idle");
  const [stepIdx, setStepIdxState] = useState(0);
  const [loopCount, setLoopCountState] = useState(0);
  const [liveMs, setLiveMsState] = useState(0);
  const [running, setRunning] = useState(false);
  const [ankiStatus, setAnkiStatus] = useState("AnkiConnect status: checking…");

  const setPhase = useCallback((next: ProgressionPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  // -------------------------------------------------------------------------
  // Derived progression
  // -------------------------------------------------------------------------
  const progression = useMemo(
    () => buildProgression(settings.progressionType, settings.keyPc),
    [settings.progressionType, settings.keyPc]
  );

  useEffect(() => {
    progressionRef.current = progression;
  }, [progression]);

  const keyRoot = useMemo(
    () => ROOTS.find((r) => r.pc === settings.keyPc) ?? ROOTS[0],
    [settings.keyPc]
  );

  const currentStep = useMemo(() => {
    const raw = progression.steps[stepIdx] ?? progression.steps[0];
    return {
      label: raw.label,
      root: raw.root,
      quality: raw.quality,
      symbol: chordSymbol(raw),
      scale:
        raw.quality.suffix === "m7"
          ? "Dorian"
          : raw.quality.suffix === "7"
          ? "Mixolydian"
          : "Ionian",
      targetPcs: buildPitchClassSet(raw.root, raw.quality.tones),
    };
  }, [progression, stepIdx]);

  // -------------------------------------------------------------------------
  // Live timer
  // -------------------------------------------------------------------------
  const startLiveTimer = useCallback(() => {
    if (liveRafRef.current !== null) return;
    readyTimeRef.current = performance.now();
    const tick = () => {
      if (readyTimeRef.current !== null) {
        setLiveMsState(performance.now() - readyTimeRef.current);
      }
      liveRafRef.current = requestAnimationFrame(tick);
    };
    liveRafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopLiveTimer = useCallback(() => {
    if (liveRafRef.current !== null) {
      cancelAnimationFrame(liveRafRef.current);
      liveRafRef.current = null;
    }
    readyTimeRef.current = null;
    setLiveMsState(0);
  }, []);

  // -------------------------------------------------------------------------
  // Loop completion
  // -------------------------------------------------------------------------
  const finishLoop = useCallback(() => {
    const stepTimes = stepTimesRef.current;
    const type = settingsRef.current.progressionType;
    const keyName = keyRoot.name;

    // Update history PBs.
    updateHistory(
      updateProgressionHistory(historyRef.current, type, keyName, stepTimes)
    );

    // Log each step as its own practice event.
    const prog = progressionRef.current;
    if (prog) {
      for (let i = 0; i < stepTimes.length; i++) {
        const step = prog.steps[i];
        if (!step) continue;
        logEventRef.current({
          progression: type,
          key: keyName,
          stepLabel: step.label,
          chord: chordSymbol(step),
          reactionTimeMs: Math.round(stepTimes[i] ?? 0),
        }).catch((err) => console.error("Failed to log progression event", err));
      }
    }

    // Audio feedback.
    if (settingsRef.current.loopChime) {
      playChime({ frequency: 1318.5 }); // E6
      setTimeout(() => playChime({ frequency: 1568 }), 130); // G6
    }

    // Anki flip.
    if (ankiFlipRef.current) {
      flipCurrentCard().catch((err) => {
        console.error("Failed to flip Anki card", err);
        setAnkiStatus("Anki flip failed");
      });
    }

    // Reset for the next loop.
    stepIdxRef.current = 0;
    setStepIdxState(0);
    stepTimesRef.current = [];
    setLoopCountState((prev) => {
      loopCountRef.current = prev + 1;
      return prev + 1;
    });

    setPhase("armed");
    stopLiveTimer();
  }, [keyRoot.name, updateHistory, playChime, setPhase, stopLiveTimer]);

  // -------------------------------------------------------------------------
  // Start / stop
  // -------------------------------------------------------------------------
  const startDrill = useCallback(() => {
    stopLiveTimer();
    stepIdxRef.current = 0;
    setStepIdxState(0);
    stepTimesRef.current = [];
    loopCountRef.current = 0;
    setLoopCountState(0);
    setLiveMsState(0);
    setRunning(true);

    // If hands are already off the keys, start timing immediately.
    if (heldPcSetRef.current.size === 0) {
      setPhase("timing");
      startLiveTimer();
    } else {
      setPhase("armed");
    }
  }, [setPhase, stopLiveTimer, startLiveTimer]);

  const stopDrill = useCallback(() => {
    stopLiveTimer();
    setPhase("idle");
    setRunning(false);
  }, [setPhase, stopLiveTimer]);

  // -------------------------------------------------------------------------
  // MIDI-driven state transitions
  // -------------------------------------------------------------------------
  const handleNoteEvent = useCallback(() => {
    if (!running) return;

    const currentPhase = phaseRef.current;
    const heldPcs = heldPcSetRef.current;

    // Hands lifted: arm / start timing.
    if (heldPcs.size === 0) {
      if (currentPhase === "armed" || currentPhase === "success") {
        setPhase("timing");
        startLiveTimer();
      }
      return;
    }

    // Hands down while timing: evaluate the chord.
    if (currentPhase === "timing") {
      const targetPcs = currentStep.targetPcs;
      const result = evaluateChordAttempt(targetPcs, heldPcs, {
        requireExact: true,
      });

      if (result.correct) {
        const elapsed = readyTimeRef.current
          ? performance.now() - readyTimeRef.current
          : 0;

        stepTimesRef.current = [...stepTimesRef.current, elapsed];

        if (settingsRef.current.stepChime) {
          playChime({ frequency: 1046.5 }); // C6
        }

        const isLastStep =
          stepIdxRef.current >= progressionRef.current!.steps.length - 1;

        if (isLastStep) {
          finishLoop();
        } else {
          const nextIdx = stepIdxRef.current + 1;
          stepIdxRef.current = nextIdx;
          setStepIdxState(nextIdx);
          setPhase("success");
          stopLiveTimer();
        }
      }
    }
  }, [
    running,
    currentStep.targetPcs,
    setPhase,
    startLiveTimer,
    stopLiveTimer,
    playChime,
    finishLoop,
  ]);

  useEffect(() => {
    const onNoteOn = (ev: Event) => {
      const detail = (ev as CustomEvent<{ note: number; pc: number }>).detail;
      heldPcSetRef.current.add(detail.pc);
      handleNoteEvent();
    };
    const onNoteOff = (ev: Event) => {
      const detail = (ev as CustomEvent<{ note: number; pc: number }>).detail;
      heldPcSetRef.current.delete(detail.pc);
      handleNoteEvent();
    };

    window.addEventListener("midi-note-on", onNoteOn);
    window.addEventListener("midi-note-off", onNoteOff);
    return () => {
      window.removeEventListener("midi-note-on", onNoteOn);
      window.removeEventListener("midi-note-off", onNoteOff);
    };
  }, [handleNoteEvent]);

  // -------------------------------------------------------------------------
  // Cleanup timers on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (liveRafRef.current !== null) {
        cancelAnimationFrame(liveRafRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Anki status ping
  // -------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    pingAnki().then((ok) => {
      if (cancelled) return;
      setAnkiStatus(
        ok
          ? "Anki connected. Will flip the card after each loop."
          : "Anki not detected. Open Anki with AnkiConnect to flip cards."
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Setting setters
  // -------------------------------------------------------------------------
  const setProgressionType = useCallback(
    (type: ProgressionType) => {
      stopDrill();
      updateSettings({ progressionType: type });
    },
    [stopDrill, updateSettings]
  );

  const setKeyRoot = useCallback(
    (root: Root) => {
      stopDrill();
      updateSettings({ keyPc: root.pc });
    },
    [stopDrill, updateSettings]
  );

  const setAnkiFlip = useCallback(
    (v: boolean) => updateSettings({ ankiFlip: v }),
    [updateSettings]
  );
  const setStepChime = useCallback(
    (v: boolean) => updateSettings({ stepChime: v }),
    [updateSettings]
  );
  const setLoopChime = useCallback(
    (v: boolean) => updateSettings({ loopChime: v }),
    [updateSettings]
  );

  const resetStats = useCallback(() => {
    const key = historyKey(settingsRef.current.progressionType, keyRoot.name);
    const next = { ...historyRef.current };
    delete next[key];
    updateHistory(next);
  }, [keyRoot.name, updateHistory]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  const stats = history[historyKey(settings.progressionType, keyRoot.name)];

  return {
    midiSupported,
    midiConnected,
    midiInputs,
    selectedInputId,
    setSelectedInputId,
    connectMidi,
    heldNotes,

    progressionType: settings.progressionType,
    setProgressionType,
    keyRoot,
    setKeyRoot,
    progression,
    currentStep,
    stepIdx,
    loopCount,

    phase,
    liveMs,
    running,
    startDrill,
    stopDrill,

    stats,
    resetStats,

    ankiFlip: settings.ankiFlip,
    setAnkiFlip,
    stepChime: settings.stepChime,
    setStepChime,
    loopChime: settings.loopChime,
    setLoopChime,

    ankiStatus,
  };
}
