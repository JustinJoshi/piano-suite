"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMidi } from "@/hooks/useMidi";
import { useAudio } from "@/hooks/useAudio";
import { useAnkiSync } from "@/hooks/useAnkiSync";
import { useArpeggioSettings } from "@/hooks/useArpeggioSettings";
import {
  ARPEGGIO_CHORDS,
  findArpeggioByRootPc,
  DEFAULT_ORDER,
  type ArpeggioSettings,
} from "@/lib/arpeggios";
import {
  activeSequence,
  currentChord,
  currentFromLabel,
  gradeForMisses,
  noteNameForPc,
  type SequenceDrill,
} from "@/lib/sequence-drill";
import { flipCurrentCard, gradeCurrentCard, type DeckStats } from "@/lib/anki";
import { normalizePc, parseRoot } from "@/lib/music-theory";
import {
  appendLocalArpeggioMiss,
  appendLocalArpeggioTransition,
} from "@/lib/local-practice-history";

export type ArpeggioPhase =
  | "idle"
  | "countdown"
  | "awaiting-root"
  | "sequence"
  | "complete";

export type ArpeggioGradeStatus = "idle" | "pending" | "sent";

export type ArpeggioGradeResult = {
  grade: "Again" | "Hard" | "Good";
  misses: number;
} | null;

export type ArpeggioTransition = {
  from: string;
  to: string;
  ms: number;
};

export type ArpeggioEngine = {
  // MIDI
  midiSupported: boolean;
  midiConnected: boolean;
  midiInputs: { id: string; name: string }[];
  selectedInputId: string | null;
  setSelectedInputId: (id: string) => void;
  connectMidi: () => Promise<void>;
  heldNotes: number[];

  // Derived sequence
  chord: SequenceDrill | null;
  chordIdx: number;
  progressText: string;

  // Drill state
  phase: ArpeggioPhase;
  targetIdx: number;
  lapCount: number;
  missCount: number;
  missesThisLap: number;
  liveMs: number;
  recentHistory: ArpeggioTransition[];
  flash: boolean;
  successFlash: boolean;
  countdownValue: number;
  breakRemaining: number;
  restartChord: () => void;
  nextChord: () => void;

  // Settings
  flashOnMiss: boolean;
  setFlashOnMiss: (v: boolean) => void;
  showLh: boolean;
  setShowLh: (v: boolean) => void;
  lapChime: boolean;
  setLapChime: (v: boolean) => void;
  config: ArpeggioSettings["config"];
  toggleChordIncluded: (id: string) => void;
  moveChord: (id: string, direction: "up" | "down") => void;
  resetOrder: () => void;
  ignoredPcs: number[];
  toggleIgnoredPc: (pc: number) => void;
  setIgnoredPcs: (pcs: number[]) => void;

  // Anki
  ankiFollow: boolean;
  setAnkiFollow: (v: boolean) => void;
  ankiStatus: string;
  deckStats: DeckStats | null;
  autoTimer: boolean;
  setAutoTimer: (v: boolean) => void;
  hideChordUntilGo: boolean;
  setHideChordUntilGo: (v: boolean) => void;
  countdownSeconds: number;
  setCountdownSeconds: (n: number) => void;
  breakSeconds: number;
  setBreakSeconds: (n: number) => void;
  breakTickSound: boolean;
  setBreakTickSound: (v: boolean) => void;
  autoGrade: boolean;
  setAutoGrade: (v: boolean) => void;
  missThresholds: { good: number; hard: number };
  setGoodMisses: (n: number) => void;
  setHardMisses: (n: number) => void;
  gradeStatus: ArpeggioGradeStatus;
  lastGradeResult: ArpeggioGradeResult;
};

/**
 * Compose the primitive hooks into a complete minor-11th arpeggio drill engine.
 */
export function useArpeggios(enabled: boolean): ArpeggioEngine {
  const { settings, loaded, updateSettings, setConfig } =
    useArpeggioSettings(enabled);

  const {
    supported: midiSupported,
    connected: midiConnected,
    inputs: midiInputs,
    selectedInputId,
    setSelectedInputId,
    heldNotes,
    connect: connectMidi,
  } = useMidi();

  const { playChime, playTick } = useAudio();

  const logTransitionMutation = useMutation(api.tracking.logArpeggioTransition);
  const logMissMutation = useMutation(api.tracking.logArpeggioMiss);
  const logTransition = useCallback(
    (args: Parameters<typeof logTransitionMutation>[0]) => {
      if (enabled) return logTransitionMutation(args);
      appendLocalArpeggioTransition({
        chord: args.chord,
        fromDeg: args.fromDeg,
        toDeg: args.toDeg,
        reactionTimeMs: args.reactionTimeMs,
      });
      return Promise.resolve(undefined);
    },
    [enabled, logTransitionMutation]
  );
  const logMiss = useCallback(
    (args: Parameters<typeof logMissMutation>[0]) => {
      if (enabled) return logMissMutation(args);
      appendLocalArpeggioMiss({
        chord: args.chord,
        fromDeg: args.fromDeg,
        toDeg: args.toDeg,
        played: args.played,
      });
      return Promise.resolve(undefined);
    },
    [enabled, logMissMutation]
  );

  // -------------------------------------------------------------------------
  // Refs for callbacks (avoid stale closures)
  // -------------------------------------------------------------------------
  const settingsRef = useRef(settings);
  const logTransitionRef = useRef(logTransition);
  const logMissRef = useRef(logMiss);
  const ankiFollowRef = useRef(false);
  const autoTimerRef = useRef(false);
  const autoGradeRef = useRef(false);
  const breakTickSoundRef = useRef(true);
  const lapChimeRef = useRef(false);
  const followedCardRef = useRef<{ cardId: number; deckName: string | null } | null>(null);
  const phaseRef = useRef<ArpeggioPhase>("idle");
  const chordIdxRef = useRef(0);
  const targetIdxRef = useRef(0);
  const lastEventTimeRef = useRef<number | null>(null);
  const missCountRef = useRef(0);
  const missesThisLapRef = useRef(0);
  const lapCountRef = useRef(0);
  const sinceArmFirstNoteRef = useRef(true);
  const recentHistoryRef = useRef<ArpeggioTransition[]>([]);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breakCancelRef = useRef<((proceeded: boolean) => void) | null>(null);
  const liveRafRef = useRef<number | null>(null);
  const ankiDefaultsAppliedRef = useRef(false);
  const pendingCardRef = useRef<{ rootPc: number; rootName: string } | null>(null);
  const ignoredPcsRef = useRef<number[]>(settings.ignoredPcs);

  useEffect(() => {
    settingsRef.current = settings;
    logTransitionRef.current = logTransition;
    logMissRef.current = logMiss;
    ankiFollowRef.current = ankiFollow;
    autoTimerRef.current = autoTimer;
    autoGradeRef.current = autoGrade;
    breakTickSoundRef.current = settings.breakTickSound;
    lapChimeRef.current = settings.lapChime;
    ignoredPcsRef.current = settings.ignoredPcs;
  });

  // -------------------------------------------------------------------------
  // Local drill state
  // -------------------------------------------------------------------------
  const [phase, setPhaseState] = useState<ArpeggioPhase>("idle");
  const [chordIdx, setChordIdxState] = useState(0);
  const [targetIdx, setTargetIdxState] = useState(0);
  const [lapCount, setLapCountState] = useState(0);
  const [missCount, setMissCountState] = useState(0);
  const [missesThisLap, setMissesThisLapState] = useState(0);
  const [liveMs, setLiveMsState] = useState(0);
  const [recentHistory, setRecentHistoryState] = useState<ArpeggioTransition[]>([]);
  const [flash, setFlash] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const [breakRemaining, setBreakRemaining] = useState(0);

  // Session-only toggles
  const [ankiFollow, setAnkiFollowState] = useState(false);
  const [autoTimer, setAutoTimerState] = useState(false);
  const [hideChordUntilGo, setHideChordUntilGoState] = useState(false);
  const [autoGrade, setAutoGradeState] = useState(false);

  const [gradeStatus, setGradeStatus] = useState<ArpeggioGradeStatus>("idle");
  const [lastGradeResult, setLastGradeResult] = useState<ArpeggioGradeResult>(null);

  const setPhase = useCallback((next: ArpeggioPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const chord = useMemo(
    () => currentChord(ARPEGGIO_CHORDS, settings.config, chordIdx),
    [settings.config, chordIdx]
  );

  const activeIds = useMemo(
    () => activeSequence(settings.config),
    [settings.config]
  );

  const progressText = useMemo(() => {
    if (!chord) return "no chords selected";
    const position = activeIds.indexOf(chord.id) + 1;
    return `chord ${position} of ${activeIds.length}`;
  }, [chord, activeIds]);

  // -------------------------------------------------------------------------
  // Live timer
  // -------------------------------------------------------------------------
  const startLiveTimer = useCallback(() => {
    if (liveRafRef.current !== null) return;
    const tick = () => {
      if (lastEventTimeRef.current !== null) {
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
  const armChord = useCallback(() => {
    if (!chord) return;
    setPhase("awaiting-root");
    setTargetIdxState(0);
    targetIdxRef.current = 0;
    setLapCountState(0);
    lapCountRef.current = 0;
    setMissCountState(0);
    missCountRef.current = 0;
    setMissesThisLapState(0);
    missesThisLapRef.current = 0;
    setRecentHistoryState([]);
    recentHistoryRef.current = [];
    lastEventTimeRef.current = null;
    sinceArmFirstNoteRef.current = true;
    setLiveMsState(0);
    startLiveTimer();
  }, [chord, setPhase, startLiveTimer]);

  // -------------------------------------------------------------------------
  // Countdown / break timers
  // -------------------------------------------------------------------------
  const stopCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback(() => {
    stopCountdown();
    const seconds = Math.max(1, Math.round(settingsRef.current.countdownSeconds || 3));
    setCountdownValue(seconds);
    setPhase("countdown");
    playTick({ frequency: 880 });
    countdownIntervalRef.current = setInterval(() => {
      setCountdownValue((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          stopCountdown();
          armChord();
          return 0;
        }
        playTick({ frequency: 880 });
        return next;
      });
    }, 1000);
  }, [setPhase, stopCountdown, playTick, armChord]);

  const runBreak = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const seconds = Math.max(0, Math.round(settingsRef.current.breakSeconds || 0));
      if (seconds <= 0) {
        resolve(true);
        return;
      }
      breakCancelRef.current = resolve;
      setBreakRemaining(seconds);
      if (breakTickSoundRef.current) playTick({ frequency: 660 });
      breakIntervalRef.current = setInterval(() => {
        setBreakRemaining((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            if (breakIntervalRef.current) {
              clearInterval(breakIntervalRef.current);
              breakIntervalRef.current = null;
            }
            breakCancelRef.current = null;
            resolve(true);
            return 0;
          }
          if (breakTickSoundRef.current) playTick({ frequency: 660 });
          return next;
        });
      }, 1000);
    });
  }, [playTick]);

  const cancelBreak = useCallback(() => {
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
      breakIntervalRef.current = null;
    }
    setBreakRemaining(0);
    if (breakCancelRef.current) {
      const resolve = breakCancelRef.current;
      breakCancelRef.current = null;
      resolve(false);
    }
  }, []);

  const finishLap = useCallback(() => {
    setLapCountState((prev) => {
      lapCountRef.current = prev + 1;
      return prev + 1;
    });
    setSuccessFlash(true);
    setTimeout(() => setSuccessFlash(false), 500);

    if (!ankiFollowRef.current) {
      if (lapChimeRef.current) playChime();
      setMissesThisLapState(0);
      missesThisLapRef.current = 0;
      return;
    }

    if (lapChimeRef.current) playChime();
    setPhase("complete");
    stopLiveTimer();

    void (async () => {
      const proceeded = await runBreak();
      if (!proceeded) return;

      try {
        await flipCurrentCard();
      } catch (err) {
        console.error("Failed to flip Anki card", err);
        setGradeStatus("idle");
        return;
      }

      if (autoGradeRef.current && ankiFollowRef.current && followedCardRef.current) {
        setGradeStatus("pending");
        try {
          const result = gradeForMisses(missesThisLapRef.current, settingsRef.current.missThresholds);
          await gradeCurrentCard(result.ease);
          setLastGradeResult({ grade: result.label, misses: missesThisLapRef.current });
          setGradeStatus("sent");
        } catch (err) {
          console.error("Failed to grade Anki card", err);
          setGradeStatus("idle");
        }
      }
    })();
  }, [playChime, runBreak, stopLiveTimer, setPhase]);

  const handleNoteOn = useCallback(
    (pc: number) => {
      if (phaseRef.current === "idle" || phaseRef.current === "countdown" || phaseRef.current === "complete") {
        return;
      }

      const current = currentChord(ARPEGGIO_CHORDS, settingsRef.current.config, chordIdxRef.current);
      if (!current) return;

      if (phaseRef.current === "awaiting-root") {
        const allHeld = current.lh.every((n) => heldPcSetRef.current.has(n.pc));
        if (allHeld) {
          setPhase("sequence");
          lastEventTimeRef.current = performance.now();
          startLiveTimer();
        }
        return;
      }

      if (phaseRef.current === "sequence") {
        const target = current.rh[targetIdxRef.current];
        if (!target) return;

        if (normalizePc(pc) === normalizePc(target.pc)) {
          const now = performance.now();
          const elapsed = lastEventTimeRef.current ? now - lastEventTimeRef.current : 0;
          const fromLabel = currentFromLabel(current, targetIdxRef.current, sinceArmFirstNoteRef.current);

          logTransitionRef.current({
            chord: current.id,
            fromDeg: fromLabel,
            toDeg: target.deg ?? target.name,
            reactionTimeMs: Math.round(elapsed),
          }).catch((err) => console.error("Failed to log arpeggio transition", err));

          const transition: ArpeggioTransition = {
            from: fromLabel,
            to: target.deg ?? target.name,
            ms: elapsed,
          };
          recentHistoryRef.current = [...recentHistoryRef.current, transition].slice(-6);
          setRecentHistoryState(recentHistoryRef.current);

          lastEventTimeRef.current = now;
          sinceArmFirstNoteRef.current = false;

          const nextIdx = (targetIdxRef.current + 1) % current.rh.length;
          targetIdxRef.current = nextIdx;
          setTargetIdxState(nextIdx);

          if (nextIdx === 0) {
            finishLap();
          }
        } else if (!ignoredPcsRef.current.includes(normalizePc(pc))) {
          setMissCountState((prev) => {
            missCountRef.current = prev + 1;
            return prev + 1;
          });
          setMissesThisLapState((prev) => {
            missesThisLapRef.current = prev + 1;
            return prev + 1;
          });

          const fromLabel = currentFromLabel(current, targetIdxRef.current, sinceArmFirstNoteRef.current);
          logMissRef.current({
            chord: current.id,
            fromDeg: fromLabel,
            toDeg: target.deg ?? target.name,
            played: noteNameForPc(pc),
          }).catch((err) => console.error("Failed to log arpeggio miss", err));

          if (settingsRef.current.flashOnMiss) {
            setFlash(true);
            setTimeout(() => setFlash(false), 260);
          }
        }
      }
    },
    [setPhase, startLiveTimer, finishLap]
  );

  // Keep a set of currently held pitch classes so the awaiting-root check can
  // be evaluated synchronously inside the note-on handler.
  const heldPcSetRef = useRef(new Set<number>());
  useEffect(() => {
    const onNoteOn = (ev: Event) => {
      const detail = (ev as CustomEvent<{ note: number; pc: number }>).detail;
      heldPcSetRef.current.add(detail.pc);
      handleNoteOn(detail.pc);
    };
    const onNoteOff = (ev: Event) => {
      const detail = (ev as CustomEvent<{ note: number; pc: number }>).detail;
      heldPcSetRef.current.delete(detail.pc);
    };
    window.addEventListener("midi-note-on", onNoteOn);
    window.addEventListener("midi-note-off", onNoteOff);
    return () => {
      window.removeEventListener("midi-note-on", onNoteOn);
      window.removeEventListener("midi-note-off", onNoteOff);
    };
  }, [handleNoteOn]);

  // -------------------------------------------------------------------------
  // Anki sync
  // -------------------------------------------------------------------------
  const applyAnkiChord = useCallback(
    (rootPc: number) => {
      const match = findArpeggioByRootPc(rootPc);
      if (!match) {
        // Should not happen for standard 12 roots, but handle gracefully.
        return;
      }
      const idx = ARPEGGIO_CHORDS.findIndex((c) => c.id === match.id);
      stopCountdown();
      cancelBreak();
      setChordIdxState(idx);
      chordIdxRef.current = idx;
      setTargetIdxState(0);
      targetIdxRef.current = 0;
      if (autoTimerRef.current) {
        startCountdown();
      } else {
        armChord();
      }
    },
    [startCountdown, armChord, stopCountdown, cancelBreak]
  );

  const handleAnkiCard = useCallback(
    (parsed: {
      card: { cardId: number; deckName: string; question: string };
      chordSymbol: string | null;
      rootName: string | null;
      qualitySuffix: string | null;
      qualityIdx: number | null;
      queue: import("@/lib/anki").AnkiCardQueue;
      deckStats: DeckStats;
    } | null) => {
      if (!parsed || !parsed.rootName) {
        followedCardRef.current = null;
        return;
      }

      const root = parseRoot(parsed.rootName);
      if (!root) {
        pendingCardRef.current = null;
        return;
      }

      const arpeggio = findArpeggioByRootPc(root.pc);
      if (!arpeggio) {
        pendingCardRef.current = null;
        return;
      }

      followedCardRef.current = {
        cardId: parsed.card.cardId,
        deckName: parsed.card.deckName,
      };

      // Apply immediately if the page is visible; otherwise queue it.
      if (document.visibilityState === "visible") {
        applyAnkiChord(root.pc);
      } else {
        pendingCardRef.current = { rootPc: root.pc, rootName: parsed.rootName };
      }
    },
    [applyAnkiChord]
  );

  const handleFirstAnkiConnect = useCallback(() => {
    if (ankiDefaultsAppliedRef.current) return;
    ankiDefaultsAppliedRef.current = true;
    setAutoTimerState(true);
    autoTimerRef.current = true;
    setHideChordUntilGoState(true);
    setAutoGradeState(true);
    autoGradeRef.current = true;
    updateSettings({
      countdownSeconds: 3,
      breakSeconds: 5,
      breakTickSound: false,
      lapChime: true,
    });
  }, [updateSettings]);

  const { status: ankiStatusRaw, parsedCard, deckStats } = useAnkiSync({
    enabled: ankiFollow,
    onCard: handleAnkiCard,
    onFirstConnect: handleFirstAnkiConnect,
  });

  const ankiStatus = useMemo(() => {
    if (!ankiFollow) return "Follow off";
    if (parsedCard?.rootName && chord?.id.startsWith(parsedCard.rootName)) {
      return `Following: ${chord?.id ?? parsedCard.rootName + "m11"}`;
    }
    if (ankiStatusRaw === "error") return "Anki not reachable";
    if (ankiStatusRaw === "no-card") return "No card in review mode";
    return "Card found, no root parsed";
  }, [ankiFollow, parsedCard, chord, ankiStatusRaw]);

  // -------------------------------------------------------------------------
  // Lifecycle: arm on mount / chord change / visibility change
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!loaded) return;
    if (document.visibilityState === "visible" && phaseRef.current === "idle") {
      if (ankiFollowRef.current && pendingCardRef.current) {
        applyAnkiChord(pendingCardRef.current.rootPc);
        pendingCardRef.current = null;
      } else {
        armChord();
      }
    }
  }, [loaded, armChord, applyAnkiChord]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible" && pendingCardRef.current) {
        applyAnkiChord(pendingCardRef.current.rootPc);
        pendingCardRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [applyAnkiChord]);

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      stopCountdown();
      cancelBreak();
      stopLiveTimer();
    };
  }, [stopCountdown, cancelBreak, stopLiveTimer]);

  // -------------------------------------------------------------------------
  // User actions
  // -------------------------------------------------------------------------
  const restartChord = useCallback(() => {
    stopCountdown();
    cancelBreak();
    setGradeStatus("idle");
    setLastGradeResult(null);
    armChord();
  }, [armChord, stopCountdown, cancelBreak]);

  const nextChord = useCallback(() => {
    stopCountdown();
    cancelBreak();
    setGradeStatus("idle");
    setLastGradeResult(null);
    setChordIdxState((prev) => {
      const next = (prev + 1) % Math.max(1, activeIds.length);
      chordIdxRef.current = next;
      return next;
    });
    setTimeout(() => armChord(), 0);
  }, [armChord, activeIds.length, stopCountdown, cancelBreak]);

  // -------------------------------------------------------------------------
  // Settings setters
  // -------------------------------------------------------------------------
  const setFlashOnMiss = useCallback(
    (v: boolean) => updateSettings({ flashOnMiss: v }),
    [updateSettings]
  );
  const setShowLh = useCallback(
    (v: boolean) => updateSettings({ showLh: v }),
    [updateSettings]
  );
  const setLapChime = useCallback(
    (v: boolean) => updateSettings({ lapChime: v }),
    [updateSettings]
  );

  const toggleChordIncluded = useCallback(
    (id: string) => {
      setConfig((prev) => {
        const excluded = prev.excluded.includes(id)
          ? prev.excluded.filter((x) => x !== id)
          : [...prev.excluded, id];
        return { ...prev, excluded };
      });
      setChordIdxState(0);
      chordIdxRef.current = 0;
      setTimeout(() => armChord(), 0);
    },
    [setConfig, armChord]
  );

  const moveChord = useCallback(
    (id: string, direction: "up" | "down") => {
      setConfig((prev) => {
        const order = prev.order.slice();
        const i = order.indexOf(id);
        if (i === -1) return prev;
        const j = direction === "up" ? i - 1 : i + 1;
        if (j < 0 || j >= order.length) return prev;
        [order[i], order[j]] = [order[j], order[i]];
        return { ...prev, order };
      });
      setChordIdxState(0);
      chordIdxRef.current = 0;
      setTimeout(() => armChord(), 0);
    },
    [setConfig, armChord]
  );

  const resetOrder = useCallback(() => {
    setConfig(() => ({ order: DEFAULT_ORDER.slice(), excluded: [] }));
    setChordIdxState(0);
    chordIdxRef.current = 0;
    setTimeout(() => armChord(), 0);
  }, [setConfig, armChord]);

  const setAnkiFollow = useCallback(
    (v: boolean) => {
      setAnkiFollowState(v);
      ankiFollowRef.current = v;
      if (!v) {
        ankiDefaultsAppliedRef.current = false;
        pendingCardRef.current = null;
        stopCountdown();
        cancelBreak();
      }
    },
    [stopCountdown, cancelBreak]
  );

  const setAutoTimer = useCallback((v: boolean) => {
    setAutoTimerState(v);
    autoTimerRef.current = v;
  }, []);

  const setHideChordUntilGo = useCallback((v: boolean) => {
    setHideChordUntilGoState(v);
  }, []);

  const setAutoGrade = useCallback((v: boolean) => {
    setAutoGradeState(v);
    autoGradeRef.current = v;
  }, []);

  const setCountdownSeconds = useCallback(
    (n: number) => updateSettings({ countdownSeconds: Math.max(1, Math.min(30, Math.round(n))) }),
    [updateSettings]
  );
  const setBreakSeconds = useCallback(
    (n: number) => updateSettings({ breakSeconds: Math.max(0, Math.min(60, Math.round(n))) }),
    [updateSettings]
  );
  const setBreakTickSound = useCallback(
    (v: boolean) => updateSettings({ breakTickSound: v }),
    [updateSettings]
  );

  const setGoodMisses = useCallback(
    (n: number) => {
      const good = Math.max(0, Math.min(99, Math.round(n)));
      const hard = Math.max(good, settingsRef.current.missThresholds.hard);
      updateSettings({ missThresholds: { good, hard } });
    },
    [updateSettings]
  );

  const setHardMisses = useCallback(
    (n: number) => {
      const hard = Math.max(0, Math.min(99, Math.round(n)));
      const good = Math.min(settingsRef.current.missThresholds.good, hard);
      updateSettings({ missThresholds: { good, hard } });
    },
    [updateSettings]
  );

  const setIgnoredPcs = useCallback(
    (pcs: number[]) => {
      const valid = pcs
        .map((n) => normalizePc(n))
        .filter((n, i, arr) => arr.indexOf(n) === i);
      updateSettings({ ignoredPcs: valid });
    },
    [updateSettings]
  );

  const toggleIgnoredPc = useCallback(
    (pc: number) => {
      const normalized = normalizePc(pc);
      setIgnoredPcs(
        settingsRef.current.ignoredPcs.includes(normalized)
          ? settingsRef.current.ignoredPcs.filter((n) => n !== normalized)
          : [...settingsRef.current.ignoredPcs, normalized]
      );
    },
    [setIgnoredPcs]
  );

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    midiSupported,
    midiConnected,
    midiInputs,
    selectedInputId,
    setSelectedInputId,
    connectMidi,
    heldNotes,

    chord,
    chordIdx,
    progressText,

    phase,
    targetIdx,
    lapCount,
    missCount,
    missesThisLap,
    liveMs,
    recentHistory,
    flash,
    successFlash,
    countdownValue,
    breakRemaining,
    restartChord,
    nextChord,

    flashOnMiss: settings.flashOnMiss,
    setFlashOnMiss,
    showLh: settings.showLh,
    setShowLh,
    lapChime: settings.lapChime,
    setLapChime,
    config: settings.config,
    toggleChordIncluded,
    moveChord,
    resetOrder,
    ignoredPcs: settings.ignoredPcs,
    toggleIgnoredPc,
    setIgnoredPcs,

    ankiFollow,
    setAnkiFollow,
    ankiStatus,
    deckStats,
    autoTimer,
    setAutoTimer,
    hideChordUntilGo,
    setHideChordUntilGo,
    countdownSeconds: settings.countdownSeconds,
    setCountdownSeconds,
    breakSeconds: settings.breakSeconds,
    setBreakSeconds,
    breakTickSound: settings.breakTickSound,
    setBreakTickSound,
    autoGrade,
    setAutoGrade,
    missThresholds: settings.missThresholds,
    setGoodMisses,
    setHardMisses,
    gradeStatus,
    lastGradeResult,
  };
}
