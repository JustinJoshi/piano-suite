"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMidi } from "@/hooks/useMidi";
import { useAudio } from "@/hooks/useAudio";
import { useRootCyclingSettings } from "@/hooks/useRootCyclingSettings";
import {
  type Root,
  ROOTS,
  type Quality,
  normalizePc,
  noteName,
} from "@/lib/music-theory";
import { evaluateChordAttempt } from "@/lib/scoring";
import {
  type RootCyclingMode,
  currentQuality,
  chordPromptSymbol,
  chordTargetPcs,
  arpeggioLhNames,
  arpeggioFromLabel,
  CANONICAL_ARPEGGIO_LH_INTERVALS,
  CANONICAL_ARPEGGIO_RH_DEGREES,
  pickRandomRoot,
} from "@/lib/root-cycling";

export type RootCyclingPhase =
  | "idle"
  | "armed"
  | "timing"
  | "success"
  | "awaiting-root"
  | "sequence";

export type RootCyclingTransition = {
  from: string;
  to: string;
  ms: number;
};

export type RootCyclingEngine = {
  // MIDI
  midiSupported: boolean;
  midiConnected: boolean;
  midiInputs: { id: string; name: string }[];
  selectedInputId: string | null;
  setSelectedInputId: (id: string) => void;
  connectMidi: () => Promise<void>;
  heldNotes: number[];

  // Selection
  mode: RootCyclingMode;
  setMode: (mode: RootCyclingMode) => void;
  quality: Quality;
  qualityIdx: number;
  setQualityIdx: (idx: number) => void;
  includedPcs: number[];
  toggleRootIncluded: (pc: number) => void;
  resetRoots: () => void;
  root: Root | null;

  // Drill state
  phase: RootCyclingPhase;
  running: boolean;
  repCount: number;
  missCount: number;
  liveMs: number;
  recentHistory: RootCyclingTransition[];
  startDrill: () => void;
  stopDrill: () => void;
  skipToNextRoot: () => void;

  // Derived display
  promptLabel: string;
  promptSymbol: string;
  lhNotes: string[];
  targetDegree: string | null;
  targetNote: string | null;
  sequenceDegrees: string[];
  sequenceTargetIdx: number;
};

/**
 * Compose the primitive hooks into a complete Root Cycling drill engine.
 */
export function useRootCycling(enabled: boolean): RootCyclingEngine {
  const { settings, updateSettings, toggleRootIncluded, resetRoots } =
    useRootCyclingSettings(enabled);

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
  const logEvent = useMutation(api.tracking.logRootCycleEvent);

  // -------------------------------------------------------------------------
  // Refs for callbacks
  // -------------------------------------------------------------------------
  const settingsRef = useRef(settings);
  const logEventRef = useRef(logEvent);
  const phaseRef = useRef<RootCyclingPhase>("idle");
  const rootPcRef = useRef<number | null>(null);
  const armStartTimeRef = useRef<number | null>(null);
  const lastEventTimeRef = useRef<number | null>(null);
  const repCountRef = useRef(0);
  const missCountRef = useRef(0);
  const targetIdxRef = useRef(0);
  const sinceArmFirstNoteRef = useRef(true);
  const recentHistoryRef = useRef<RootCyclingTransition[]>([]);
  const liveRafRef = useRef<number | null>(null);
  const heldPcSetRef = useRef(new Set<number>());

  useEffect(() => {
    settingsRef.current = settings;
    logEventRef.current = logEvent;
  });

  // -------------------------------------------------------------------------
  // Local drill state
  // -------------------------------------------------------------------------
  const [phase, setPhaseState] = useState<RootCyclingPhase>("idle");
  const [running, setRunning] = useState(false);
  const [rootPc, setRootPcState] = useState<number | null>(null);
  const [repCount, setRepCountState] = useState(0);
  const [missCount, setMissCountState] = useState(0);
  const [liveMs, setLiveMsState] = useState(0);
  const [recentHistory, setRecentHistory] = useState<RootCyclingTransition[]>([]);
  const [targetIdx, setTargetIdxState] = useState(0);

  const setPhase = useCallback((next: RootCyclingPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const root = useMemo(
    () => ROOTS.find((r) => r.pc === rootPc) ?? null,
    [rootPc]
  );

  const quality = useMemo(() => currentQuality(settings), [settings]);

  // -------------------------------------------------------------------------
  // Live timer
  // -------------------------------------------------------------------------
  const startLiveTimer = useCallback(() => {
    if (liveRafRef.current !== null) return;
    const tick = () => {
      if (settingsRef.current.mode === "chord" && armStartTimeRef.current !== null) {
        setLiveMsState(performance.now() - armStartTimeRef.current);
      } else if (
        settingsRef.current.mode === "arpeggio" &&
        lastEventTimeRef.current !== null
      ) {
        setLiveMsState(performance.now() - lastEventTimeRef.current);
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
    setLiveMsState(0);
  }, []);

  // -------------------------------------------------------------------------
  // Core drill actions
  // -------------------------------------------------------------------------
  const armRep = useCallback(
    (isFirstEver: boolean) => {
      const nextPc = pickRandomRoot(
        settingsRef.current.includedPcs,
        isFirstEver ? null : rootPcRef.current
      );
      rootPcRef.current = nextPc;
      setRootPcState(nextPc);
      targetIdxRef.current = 0;
      setTargetIdxState(0);
      sinceArmFirstNoteRef.current = true;
      lastEventTimeRef.current = null;
      armStartTimeRef.current = null;
      recentHistoryRef.current = [];
      setRecentHistory([]);
      setLiveMsState(0);

      if (nextPc === null) {
        setPhase("idle");
        return;
      }

      if (settingsRef.current.mode === "chord") {
        const heldEmpty = heldPcSetRef.current.size === 0;
        if (heldEmpty) {
          setPhase("timing");
          armStartTimeRef.current = performance.now();
          startLiveTimer();
        } else {
          setPhase("armed");
        }
      } else {
        setPhase("awaiting-root");
      }
    },
    [setPhase, startLiveTimer]
  );

  const startDrill = useCallback(() => {
    setRunning(true);
    setRepCountState(0);
    repCountRef.current = 0;
    setMissCountState(0);
    missCountRef.current = 0;
    armRep(true);
  }, [armRep]);

  const stopDrill = useCallback(() => {
    stopLiveTimer();
    setRunning(false);
    setPhase("idle");
    rootPcRef.current = null;
    setRootPcState(null);
  }, [setPhase, stopLiveTimer]);

  const skipToNextRoot = useCallback(() => {
    if (!running) return;
    armRep(false);
  }, [running, armRep]);

  // -------------------------------------------------------------------------
  // Logging
  // -------------------------------------------------------------------------
  const logChordAttempt = useCallback(
    (rootName: string, quality: Quality, ms: number) => {
      logEventRef.current({
        mode: "chord",
        label: `${rootName}${quality.suffix}`,
        root: rootName,
        quality: quality.suffix,
        reactionTimeMs: Math.round(ms),
      }).catch((err) => console.error("Failed to log root-cycling chord", err));
    },
    []
  );

  const logArpeggioTransition = useCallback(
    (
      rootName: string,
      fromDeg: string,
      toDeg: string,
      ms: number
    ) => {
      logEventRef.current({
        mode: "arpeggio",
        label: "m11-idea",
        root: rootName,
        fromDeg,
        toDeg,
        reactionTimeMs: Math.round(ms),
      }).catch((err) =>
        console.error("Failed to log root-cycling transition", err)
      );
    },
    []
  );

  // -------------------------------------------------------------------------
  // MIDI-driven state transitions
  // -------------------------------------------------------------------------
  const handleNoteOn = useCallback(
    (pc: number) => {
      if (!running || rootPcRef.current === null) return;
      const root = ROOTS.find((r) => r.pc === rootPcRef.current);
      if (!root) return;

      if (settingsRef.current.mode === "chord") {
        if (phaseRef.current !== "timing") return;

        const targetPcs = chordTargetPcs(root, currentQuality(settingsRef.current));
        const result = evaluateChordAttempt(targetPcs, heldPcSetRef.current, {
          requireExact: true,
        });

        if (result.correct) {
          const elapsed = armStartTimeRef.current
            ? performance.now() - armStartTimeRef.current
            : 0;
          logChordAttempt(root.name, currentQuality(settingsRef.current), elapsed);
          recentHistoryRef.current = [
            {
              from: "—",
              to: `${root.name}${currentQuality(settingsRef.current).suffix}`,
              ms: elapsed,
            },
          ];
          setRecentHistory(recentHistoryRef.current);
          setPhase("success");
          stopLiveTimer();
          setRepCountState((prev) => {
            repCountRef.current = prev + 1;
            return prev + 1;
          });
          playChime();
        } else if (heldPcSetRef.current.size >= targetPcs.size) {
          setMissCountState((prev) => {
            missCountRef.current = prev + 1;
            return prev + 1;
          });
        }
        return;
      }

      // Arpeggio mode
      if (phaseRef.current === "awaiting-root") {
        const lhPcs = new Set(
          CANONICAL_ARPEGGIO_LH_INTERVALS.map((iv) => normalizePc(root.pc + iv))
        );
        const allHeld = [...lhPcs].every((p) => heldPcSetRef.current.has(p));
        if (allHeld) {
          setPhase("sequence");
          lastEventTimeRef.current = performance.now();
          startLiveTimer();
        }
        return;
      }

      if (phaseRef.current === "sequence") {
        const degree = CANONICAL_ARPEGGIO_RH_DEGREES[targetIdxRef.current];
        if (!degree) return;
        const targetPc = normalizePc(root.pc + degree.iv);

        if (normalizePc(pc) === targetPc) {
          const now = performance.now();
          const elapsed = lastEventTimeRef.current
            ? now - lastEventTimeRef.current
            : 0;
          const fromDeg = arpeggioFromLabel(
            targetIdxRef.current,
            sinceArmFirstNoteRef.current
          );

          logArpeggioTransition(root.name, fromDeg, degree.deg, elapsed);

          const transition: RootCyclingTransition = {
            from: fromDeg,
            to: degree.deg,
            ms: elapsed,
          };
          recentHistoryRef.current = [...recentHistoryRef.current, transition].slice(-6);
          setRecentHistory(recentHistoryRef.current);

          lastEventTimeRef.current = now;
          sinceArmFirstNoteRef.current = false;

          const nextIdx = (targetIdxRef.current + 1) % CANONICAL_ARPEGGIO_RH_DEGREES.length;
          targetIdxRef.current = nextIdx;
          setTargetIdxState(nextIdx);

          if (nextIdx === 0) {
            setRepCountState((prev) => {
              repCountRef.current = prev + 1;
              return prev + 1;
            });
            playChime();
          }
        } else {
          setMissCountState((prev) => {
            missCountRef.current = prev + 1;
            return prev + 1;
          });
        }
      }
    },
    [running, setPhase, stopLiveTimer, startLiveTimer, logChordAttempt, logArpeggioTransition, playChime]
  );

  useEffect(() => {
    const onNoteOn = (ev: Event) => {
      const detail = (ev as CustomEvent<{ note: number; pc: number }>).detail;
      heldPcSetRef.current.add(detail.pc);
      handleNoteOn(detail.pc);
    };
    const onNoteOff = (ev: Event) => {
      const detail = (ev as CustomEvent<{ note: number; pc: number }>).detail;
      heldPcSetRef.current.delete(detail.pc);

      if (!running) return;

      if (
        settingsRef.current.mode === "chord" &&
        phaseRef.current === "armed" &&
        heldPcSetRef.current.size === 0
      ) {
        setPhase("timing");
        armStartTimeRef.current = performance.now();
        startLiveTimer();
      }
    };

    window.addEventListener("midi-note-on", onNoteOn);
    window.addEventListener("midi-note-off", onNoteOff);
    return () => {
      window.removeEventListener("midi-note-on", onNoteOn);
      window.removeEventListener("midi-note-off", onNoteOff);
    };
  }, [handleNoteOn, running, setPhase, startLiveTimer]);

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      stopLiveTimer();
    };
  }, [stopLiveTimer]);

  // -------------------------------------------------------------------------
  // Settings setters
  // -------------------------------------------------------------------------
  const setMode = useCallback(
    (mode: RootCyclingMode) => {
      stopDrill();
      updateSettings({ mode });
    },
    [stopDrill, updateSettings]
  );

  const setQualityIdx = useCallback(
    (idx: number) => {
      stopDrill();
      updateSettings({ qualityIdx: idx });
    },
    [stopDrill, updateSettings]
  );

  // -------------------------------------------------------------------------
  // Derived display values
  // -------------------------------------------------------------------------
  const promptData = useMemo(() => {
    if (!root) {
      return {
        label: settings.includedPcs.length
          ? "press start"
          : "no roots selected — use customize roots",
        symbol: "—",
        lhNotes: [] as string[],
        targetDegree: null as string | null,
        targetNote: null as string | null,
      };
    }

    if (settings.mode === "chord") {
      const label =
        phase === "armed"
          ? "lift your hands fully off the keys"
          : phase === "timing"
          ? "play it"
          : phase === "success"
          ? "✓ nice — skip to the next root"
          : "press start";
      return {
        label,
        symbol: chordPromptSymbol(root, quality),
        lhNotes: [],
        targetDegree: null,
        targetNote: null,
      };
    }

    const lhNotes = arpeggioLhNames(root);
    if (phase === "sequence") {
      const degree = CANONICAL_ARPEGGIO_RH_DEGREES[targetIdx];
      if (!degree) {
        return {
          label: "play the root + 5th to begin",
          symbol: lhNotes.join(" + "),
          lhNotes,
          targetDegree: null,
          targetNote: null,
        };
      }
      const targetPc = normalizePc(root.pc + degree.iv);
      return {
        label: `next (${degree.deg})`,
        symbol: root.name,
        lhNotes,
        targetDegree: degree.deg,
        targetNote: noteName(targetPc, root.flat),
      };
    }

    return {
      label: "play the root + 5th to begin",
      symbol: lhNotes.join(" + "),
      lhNotes,
      targetDegree: null,
      targetNote: null,
    };
  }, [root, settings.mode, settings.includedPcs.length, phase, quality, targetIdx]);

  const sequenceDegrees = useMemo(
    () => CANONICAL_ARPEGGIO_RH_DEGREES.map((d) => d.deg),
    []
  );

  return {
    midiSupported,
    midiConnected,
    midiInputs,
    selectedInputId,
    setSelectedInputId,
    connectMidi,
    heldNotes,

    mode: settings.mode,
    setMode,
    quality,
    qualityIdx: settings.qualityIdx,
    setQualityIdx,
    includedPcs: settings.includedPcs,
    toggleRootIncluded,
    resetRoots,
    root,

    phase,
    running,
    repCount,
    missCount,
    liveMs,
    recentHistory,
    startDrill,
    stopDrill,
    skipToNextRoot,

    promptLabel: promptData.label,
    promptSymbol: promptData.symbol,
    lhNotes: promptData.lhNotes,
    targetDegree: promptData.targetDegree,
    targetNote: promptData.targetNote,
    sequenceDegrees,
    sequenceTargetIdx: targetIdx,
  };
}
