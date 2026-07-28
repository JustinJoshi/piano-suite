"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { type Id } from "@/convex/_generated/dataModel";
import { useMidi } from "@/hooks/useMidi";
import { useAudio } from "@/hooks/useAudio";
import { useDrillTimer } from "@/hooks/useDrillTimer";
import { useAnkiSync } from "@/hooks/useAnkiSync";
import {
  ROOTS,
  SINGLE_QUALITIES,
  FAMILY,
  EXTENDED,
  type Root,
  type Quality,
  buildChord,
  buildPitchClassSet,
  noteName,
} from "@/lib/music-theory";
import { evaluateChordAttempt } from "@/lib/scoring";
import {
  flipCurrentCard,
  gradeCurrentCard,
  type AnkiCardQueue,
  type DeckStats,
} from "@/lib/anki";
import {
  type ChordDrillHistory,
  type ChordDrillMode,
  gradeForTime,
  effectiveRepTarget,
  updateHistory as updateHistoryPure,
} from "@/lib/chord-drill";
import { useChordDrillSettings } from "@/hooks/useChordDrillSettings";

export type ChordDrillGradeStatus = "idle" | "pending" | "sent";

export type ChordDrillGradeResult = {
  grade: "Again" | "Hard" | "Good";
  ms: number;
} | null;

export type ChordDrillEngine = {
  // MIDI
  midiSupported: boolean;
  midiConnected: boolean;
  midiInputs: { id: string; name: string }[];
  selectedInputId: string | null;
  setSelectedInputId: (id: string) => void;
  connectMidi: () => Promise<void>;
  heldNotes: number[];
  heldNotesDisplay: string[];

  // Derived chord
  mode: ChordDrillMode;
  setMode: (mode: ChordDrillMode) => void;
  root: Root;
  setRoot: (root: Root) => void;
  qualityIdx: number;
  setQualityIdx: (idx: number) => void;
  symbol: string;
  chordNotes: string[];
  targetPcs: Set<number>;
  familyList: Quality[];

  // Drill state
  phase: string;
  liveMs: number;
  countdownValue: number;
  breakRemaining: number;
  running: boolean;
  justCompleted: boolean;
  repCount: number;
  repTarget: number;
  currentRepTarget: number;
  setRepTarget: (n: number) => void;
  repTimes: number[];
  startDrill: () => void;
  stopDrill: () => void;
  nextChord: () => void;
  redoChord: () => void;

  // Stats
  history: ChordDrillHistory;
  resetStats: () => void;

  // Display settings
  showNotes: boolean;
  setShowNotes: (v: boolean) => void;
  revealNotesOnFinish: boolean;
  setRevealNotesOnFinish: (v: boolean) => void;
  requireExactNotes: boolean;
  setRequireExactNotes: (v: boolean) => void;
  celebrateGood: boolean;
  setCelebrateGood: (v: boolean) => void;

  // Per-chord reps
  perChordRepsEnabled: boolean;
  setPerChordRepsEnabled: (v: boolean) => void;
  perChordReps: Record<string, number>;
  setPerChordRep: (chordKey: string, value: number | null) => void;
  clearPerChordReps: () => void;

  // New-card boost
  showNewNotes: boolean;
  setShowNewNotes: (v: boolean) => void;
  newCardRepBoost: boolean;
  setNewCardRepBoost: (v: boolean) => void;
  newCardRepTarget: number;
  setNewCardRepTarget: (n: number) => void;
  currentCardQueue: AnkiCardQueue;

  // Anki
  ankiFollow: boolean;
  setAnkiFollow: (v: boolean) => void;
  ankiStatus: string;
  deckStats: DeckStats | null;
  autoTimer: boolean;
  setAutoTimer: (v: boolean) => void;
  countdownSeconds: number;
  setCountdownSeconds: (n: number) => void;
  hideChordUntilGo: boolean;
  setHideChordUntilGo: (v: boolean) => void;
  startCountdownEnabled: boolean;
  setStartCountdownEnabled: (v: boolean) => void;
  breakSeconds: number;
  setBreakSeconds: (n: number) => void;
  breakTickSound: boolean;
  setBreakTickSound: (v: boolean) => void;
  autoGrade: boolean;
  setAutoGrade: (v: boolean) => void;
  gradeThresholds: { good: number; hard: number };
  setGoodThreshold: (ms: number) => void;
  setHardThreshold: (ms: number) => void;
  gradeStatus: ChordDrillGradeStatus;
  lastGradeResult: ChordDrillGradeResult;

  // Confetti
  confettiKey: number;

  // Shuffle
  shuffleChord: () => void;
};

/**
 * Compose the primitive hooks into a complete blocked chord-drill engine.
 */
export function useChordDrill(enabled: boolean): ChordDrillEngine {
  const {
    settings,
    history,
    loaded,
    updateSettings,
    updateHistory,
  } = useChordDrillSettings(enabled);

  // -------------------------------------------------------------------------
  // Primitive hooks
  // -------------------------------------------------------------------------
  const {
    supported: midiSupported,
    connected: midiConnected,
    inputs: midiInputs,
    selectedInputId,
    setSelectedInputId,
    heldNotes,
    heldPcs,
    connect: connectMidi,
  } = useMidi();

  const { playChime, playTick } = useAudio();

  const [activeCountdownSeconds, setActiveCountdownSeconds] = useState(
    settings.countdownSeconds
  );

  const logEventMutation = useMutation(api.tracking.logChordDrillEvent);
  const updateGradeMutation = useMutation(api.tracking.updateChordDrillGrade);
  const logEvent = useCallback(
    (args: Parameters<typeof logEventMutation>[0]) =>
      enabled ? logEventMutation(args) : Promise.resolve(null),
    [enabled, logEventMutation]
  );
  const updateGrade = useCallback(
    (args: Parameters<typeof updateGradeMutation>[0]) =>
      enabled ? updateGradeMutation(args) : Promise.resolve(undefined),
    [enabled, updateGradeMutation]
  );

  // -------------------------------------------------------------------------
  // Refs for callbacks (avoid stale closures)
  // -------------------------------------------------------------------------
  const timerRef = useRef<ReturnType<typeof useDrillTimer> | null>(null);
  const settingsRef = useRef(settings);
  const historyRef = useRef(history);
  const chordKeyRef = useRef("");
  const currentRepTargetRef = useRef(12);
  const repTimesRef = useRef<number[]>([]);
  const roundIsRedoRef = useRef(false);
  const pendingEventIdRef = useRef<Id<"practiceEvents"> | null>(null);
  const repTargetRef = useRef(12);
  const currentCardQueueRef = useRef<AnkiCardQueue>(null);
  const startCountdownEnabledRef = useRef(false);
  const updateHistoryRef = useRef(updateHistory);
  const logEventRef = useRef(logEvent);
  const updateGradeRef = useRef(updateGrade);
  const followedCardRef = useRef<{ cardId: number; deckName: string | null } | null>(null);
  const ankiFollowRef = useRef(false);
  const autoGradeRef = useRef(false);

  useEffect(() => {
    settingsRef.current = settings;
    historyRef.current = history;
    updateHistoryRef.current = updateHistory;
    logEventRef.current = logEvent;
    updateGradeRef.current = updateGrade;
    ankiFollowRef.current = ankiFollow;
    autoGradeRef.current = autoGrade;
    autoTimerRef.current = autoTimer;
    repTargetRef.current = repTarget;
    currentCardQueueRef.current = currentCardQueue;
    startCountdownEnabledRef.current = startCountdownEnabled;
  });

  // -------------------------------------------------------------------------
  // Local drill state
  // -------------------------------------------------------------------------
  const [mode, setModeState] = useState<ChordDrillMode>("single");
  const [root, setRootState] = useState<Root>(ROOTS[0]);
  const [qualityIdx, setQualityIdxState] = useState(0);
  const [repTarget, setRepTargetState] = useState(12);

  const [showNotes, setShowNotes] = useState(false);
  const [revealNotesOnFinish, setRevealNotesOnFinish] = useState(false);

  // Session-only toggles
  const [ankiFollow, setAnkiFollowState] = useState(false);
  const [autoTimer, setAutoTimerState] = useState(false);
  const [hideChordUntilGo, setHideChordUntilGoState] = useState(false);
  const [startCountdownEnabled, setStartCountdownEnabledState] = useState(false);
  const [autoGrade, setAutoGradeState] = useState(false);

  const [running, setRunning] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const repCountRef = useRef(0);
  const [repTimes, setRepTimes] = useState<number[]>([]);
  const [roundIsRedo, setRoundIsRedo] = useState(false);
  const [currentRepTarget, setCurrentRepTarget] = useState(12);
  const [pendingEventId, setPendingEventId] = useState<Id<"practiceEvents"> | null>(null);

  const [gradeStatus, setGradeStatus] = useState<ChordDrillGradeStatus>("idle");
  const [lastGradeResult, setLastGradeResult] = useState<ChordDrillGradeResult>(null);
  const [confettiKey, setConfettiKey] = useState(0);

  const [currentCardQueue, setCurrentCardQueue] = useState<AnkiCardQueue>(null);

  const ankiDefaultsAppliedRef = useRef(false);
  const autoTimerRef = useRef(false);

  // -------------------------------------------------------------------------
  // Derived chord
  // -------------------------------------------------------------------------
  const currentQualityList = useMemo(() => {
    if (mode === "family") return FAMILY;
    if (mode === "extended") return EXTENDED;
    return SINGLE_QUALITIES;
  }, [mode]);

  const currentQuality = useMemo(
    () => currentQualityList[qualityIdx],
    [currentQualityList, qualityIdx]
  );

  const symbol = useMemo(
    () => `${root.name}${currentQuality.suffix}`,
    [root, currentQuality]
  );

  const chordNotes = useMemo(
    () => buildChord(root, currentQuality.tones),
    [root, currentQuality]
  );

  const targetPcs = useMemo(
    () => buildPitchClassSet(root, currentQuality.tones),
    [root, currentQuality]
  );

  const chordKey = symbol;

  const heldNotesDisplay = useMemo(
    () => heldNotes.map((n) => noteName(n % 12, root.flat)),
    [heldNotes, root]
  );

  useEffect(() => {
    chordKeyRef.current = chordKey;
  }, [chordKey]);

  useEffect(() => {
    currentRepTargetRef.current = currentRepTarget;
  }, [currentRepTarget]);

  useEffect(() => {
    repTimesRef.current = repTimes;
  }, [repTimes]);

  useEffect(() => {
    repCountRef.current = repCount;
  }, [repCount]);

  useEffect(() => {
    roundIsRedoRef.current = roundIsRedo;
  }, [roundIsRedo]);

  useEffect(() => {
    pendingEventIdRef.current = pendingEventId;
  }, [pendingEventId]);

  // -------------------------------------------------------------------------
  // Timer callbacks
  // -------------------------------------------------------------------------
  const handleTimerSuccess = useCallback((elapsed: number) => {
    playChime();

    const nextRepCount = repCountRef.current + 1;
    setRepCount(nextRepCount);
    repCountRef.current = nextRepCount;

    const nextRepTimes = [...repTimesRef.current, elapsed];
    setRepTimes(nextRepTimes);
    repTimesRef.current = nextRepTimes;

    const isFirst = nextRepCount === 1;
    const settings = settingsRef.current;
    const chordKey = chordKeyRef.current;

    if (isFirst) {
      updateHistoryRef.current(
        updateHistoryPure(historyRef.current, chordKey, [elapsed])
      );

      logEventRef.current({
        chord: chordKey,
        reactionTimeMs: Math.round(elapsed),
        redo: roundIsRedoRef.current,
      })
        .then((id) => {
          setPendingEventId(id);
          pendingEventIdRef.current = id;
        })
        .catch((err) => console.error("Failed to log chord drill event", err));

      if (settings.celebrateGood && elapsed < settings.gradeThresholds.good) {
        setConfettiKey((k) => k + 1);
      }
    }

    if (nextRepCount >= currentRepTargetRef.current) {
      updateHistoryRef.current(
        updateHistoryPure(historyRef.current, chordKey, nextRepTimes)
      );
      timerRef.current?.finishRound();
    } else {
      timerRef.current?.nextRep();
    }
  }, [playChime]);

  const handleTimerFinish = useCallback(async () => {
    setRunning(false);
    setJustCompleted(true);

    const card = followedCardRef.current;
    if (!autoGradeRef.current || !ankiFollowRef.current || !card) {
      setGradeStatus("idle");
      return;
    }

    setGradeStatus("pending");
    try {
      await flipCurrentCard();
      const first = repTimesRef.current[0] ?? 0;
      const result = gradeForTime(first, settingsRef.current.gradeThresholds);
      await gradeCurrentCard(result.ease);
      setLastGradeResult({ grade: result.label, ms: first });
      setGradeStatus("sent");
      const eventId = pendingEventIdRef.current;
      if (eventId) {
        await updateGradeRef.current({ eventId, grade: result.label });
      }
    } catch (err) {
      console.error("Anki grading failed", err);
      setGradeStatus("idle");
    }
  }, []);

  const timer = useDrillTimer({
    countdownSeconds: activeCountdownSeconds,
    breakSeconds: settings.breakSeconds,
    multiRep: true,
    onSuccess: handleTimerSuccess,
    onFinish: handleTimerFinish,
  });

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  // -------------------------------------------------------------------------
  // Settings sync
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (loaded) {
      setModeState(settings.mode);
      setRepTargetState(settings.repTarget);
      setActiveCountdownSeconds(settings.countdownSeconds);
    }
  }, [loaded, settings.mode, settings.repTarget, settings.countdownSeconds]);

  // Refresh current rep target whenever relevant state changes, but never
  // mid-round so the target can't jump underneath the user.
  useEffect(() => {
    if (!running) {
      const target = effectiveRepTarget({
        chordKey,
        baseTarget: repTarget,
        perChordRepsEnabled: settings.perChordRepsEnabled,
        perChordReps: settings.perChordReps,
        newCardRepBoost: settings.newCardRepBoost,
        newCardRepTarget: settings.newCardRepTarget,
        currentCardQueue,
      });
      setCurrentRepTarget(target);
    }
  }, [
    running,
    chordKey,
    repTarget,
    settings.perChordRepsEnabled,
    settings.perChordReps,
    settings.newCardRepBoost,
    settings.newCardRepTarget,
    currentCardQueue,
  ]);

  // -------------------------------------------------------------------------
  // Anki sync
  // -------------------------------------------------------------------------
  const handleAnkiCard = useCallback(
    (parsed: {
      card: { cardId: number; deckName: string; question: string };
      chordSymbol: string | null;
      rootName: string | null;
      qualitySuffix: string | null;
      qualityIdx: number | null;
      queue: AnkiCardQueue;
      deckStats: DeckStats;
    } | null) => {
      if (!parsed) {
        setCurrentCardQueue(null);
        followedCardRef.current = null;
        return;
      }

      setCurrentCardQueue(parsed.queue);
      followedCardRef.current = {
        cardId: parsed.card.cardId,
        deckName: parsed.card.deckName,
      };

      if (parsed.rootName && parsed.qualityIdx !== null) {
        const parsedRoot = ROOTS.find((r) => r.name === parsed.rootName);
        if (parsedRoot) {
          setModeState("single");
          setRootState(parsedRoot);
          setQualityIdxState(parsed.qualityIdx);
          const quality = SINGLE_QUALITIES[parsed.qualityIdx];
          chordKeyRef.current = `${parsedRoot.name}${quality.suffix}`;
        }
      }

      if (autoTimerRef.current && midiConnected) {
        setActiveCountdownSeconds(settingsRef.current.countdownSeconds);
        startDrillInternal(true);
      }
    },
    [midiConnected]
  );

  const handleFirstAnkiConnect = useCallback(() => {
    if (ankiDefaultsAppliedRef.current) return;
    ankiDefaultsAppliedRef.current = true;
    setAutoTimer(true);
    autoTimerRef.current = true;
    setHideChordUntilGo(true);
    setStartCountdownEnabled(false);
    updateSettings({
      countdownSeconds: 3,
      breakSeconds: 5,
      breakTickSound: false,
    });
    setAutoGrade(true);
    autoGradeRef.current = true;
  }, [updateSettings]);

  const { status: ankiStatusRaw, parsedCard, deckStats } = useAnkiSync({
    enabled: ankiFollow,
    onCard: handleAnkiCard,
    onFirstConnect: handleFirstAnkiConnect,
  });

  const ankiStatus = useMemo(() => {
    if (!ankiFollow) return "Follow off";
    if (parsedCard?.chordSymbol) return `Following: ${parsedCard.chordSymbol}`;
    if (ankiStatusRaw === "error") return "Anki not reachable";
    if (ankiStatusRaw === "no-card") return "No card in review mode";
    return "Card found, no chord parsed";
  }, [ankiFollow, parsedCard, ankiStatusRaw]);

  // -------------------------------------------------------------------------
  // MIDI handling
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!running) return;

    if (heldPcs.size === 0) {
      if (timer.phase === "armed") {
        timer.arm();
      } else if (timer.phase === "success") {
        timer.nextRep();
        timer.arm();
      }
      return;
    }

    if (timer.phase === "timing") {
      const result = evaluateChordAttempt(targetPcs, heldPcs, {
        requireExact: settings.requireExactNotes,
      });
      if (result.correct) {
        timer.markSuccess();
      }
    }
  }, [
    heldPcs,
    running,
    targetPcs,
    settings.requireExactNotes,
    timer.phase,
    timer.arm,
    timer.nextRep,
    timer.markSuccess,
  ]);

  // -------------------------------------------------------------------------
  // Audio feedback for countdowns
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (timer.phase === "countdown" && timer.countdownValue > 0) {
      playTick({ frequency: 880 });
    }
  }, [timer.countdownValue, timer.phase, playTick]);

  useEffect(() => {
    if (
      timer.phase === "break-before-grade" &&
      timer.breakRemaining > 0 &&
      settings.breakTickSound
    ) {
      playTick({ frequency: 660 });
    }
  }, [timer.breakRemaining, timer.phase, settings.breakTickSound, playTick]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------
  const startDrillInternal = useCallback((fromAnki = false) => {
    const t = timerRef.current;
    t?.cancel();
    setRepCount(0);
    repCountRef.current = 0;
    setRepTimes([]);
    repTimesRef.current = [];
    setJustCompleted(false);
    setRoundIsRedo(false);
    roundIsRedoRef.current = false;
    setPendingEventId(null);
    pendingEventIdRef.current = null;
    setGradeStatus("idle");

    const settings = settingsRef.current;
    const target = effectiveRepTarget({
      chordKey: chordKeyRef.current,
      baseTarget: repTargetRef.current,
      perChordRepsEnabled: settings.perChordRepsEnabled,
      perChordReps: settings.perChordReps,
      newCardRepBoost: settings.newCardRepBoost,
      newCardRepTarget: settings.newCardRepTarget,
      currentCardQueue: currentCardQueueRef.current,
    });
    setCurrentRepTarget(target);

    const useCountdown = fromAnki
      ? settings.countdownSeconds > 0
      : startCountdownEnabledRef.current && settings.countdownSeconds > 0;
    setActiveCountdownSeconds(useCountdown ? settings.countdownSeconds : 0);

    setRunning(true);
    t?.start();
  }, []);

  const startDrill = useCallback(() => {
    startDrillInternal(false);
  }, [startDrillInternal]);

  const qualityListLengthRef = useRef(currentQualityList.length);
  useEffect(() => {
    qualityListLengthRef.current = currentQualityList.length;
  }, [currentQualityList.length]);

  const stopDrill = useCallback(() => {
    timerRef.current?.cancel();
    setRunning(false);
    setJustCompleted(false);
  }, []);

  const nextChord = useCallback(() => {
    timerRef.current?.cancel();
    setJustCompleted(false);
    setRepCount(0);
    repCountRef.current = 0;
    setRepTimes([]);
    repTimesRef.current = [];
    setQualityIdxState((prev) => (prev + 1) % qualityListLengthRef.current);
  }, []);

  const redoChord = useCallback(() => {
    timerRef.current?.cancel();
    setJustCompleted(false);
    setRoundIsRedo(true);
    roundIsRedoRef.current = true;
    setRepCount(0);
    repCountRef.current = 0;
    setRepTimes([]);
    repTimesRef.current = [];
    setPendingEventId(null);
    pendingEventIdRef.current = null;
    setGradeStatus("idle");

    const settings = settingsRef.current;
    const target = effectiveRepTarget({
      chordKey: chordKeyRef.current,
      baseTarget: repTargetRef.current,
      perChordRepsEnabled: settings.perChordRepsEnabled,
      perChordReps: settings.perChordReps,
      newCardRepBoost: settings.newCardRepBoost,
      newCardRepTarget: settings.newCardRepTarget,
      currentCardQueue: currentCardQueueRef.current,
    });
    setCurrentRepTarget(target);

    setActiveCountdownSeconds(0);
    setRunning(true);
    timerRef.current?.start();
  }, []);

  const resetStats = useCallback(() => {
    const next = { ...historyRef.current };
    delete next[chordKeyRef.current];
    updateHistoryRef.current(next);
  }, []);

  const shuffleChord = useCallback(() => {
    stopDrill();
    setRootState(ROOTS[Math.floor(Math.random() * ROOTS.length)]);
    setQualityIdxState(Math.floor(Math.random() * currentQualityList.length));
  }, [stopDrill, currentQualityList.length]);

  // -------------------------------------------------------------------------
  // Setting setters
  // -------------------------------------------------------------------------
  const setMode = useCallback(
    (mode: ChordDrillMode) => {
      stopDrill();
      setModeState(mode);
      setQualityIdxState(0);
      updateSettings({ mode });
    },
    [stopDrill, updateSettings]
  );

  const setRoot = useCallback(
    (root: Root) => {
      stopDrill();
      setRootState(root);
    },
    [stopDrill]
  );

  const setQualityIdx = useCallback(
    (idx: number) => {
      stopDrill();
      setQualityIdxState(idx);
    },
    [stopDrill]
  );

  const setRepTarget = useCallback(
    (n: number) => {
      const val = Math.max(1, Math.min(999, Math.round(n)));
      setRepTargetState(val);
      updateSettings({ repTarget: val });
    },
    [updateSettings]
  );

  const setRequireExactNotes = useCallback(
    (v: boolean) => updateSettings({ requireExactNotes: v }),
    [updateSettings]
  );
  const setCelebrateGood = useCallback(
    (v: boolean) => updateSettings({ celebrateGood: v }),
    [updateSettings]
  );
  const setShowNewNotes = useCallback(
    (v: boolean) => updateSettings({ showNewNotes: v }),
    [updateSettings]
  );
  const setNewCardRepBoost = useCallback(
    (v: boolean) => updateSettings({ newCardRepBoost: v }),
    [updateSettings]
  );
  const setNewCardRepTarget = useCallback(
    (n: number) => updateSettings({ newCardRepTarget: Math.max(1, Math.min(999, Math.round(n))) }),
    [updateSettings]
  );
  const setPerChordRepsEnabled = useCallback(
    (v: boolean) => updateSettings({ perChordRepsEnabled: v }),
    [updateSettings]
  );
  const setPerChordRep = useCallback(
    (chordKey: string, value: number | null) => {
      const next = { ...settings.perChordReps };
      if (value === null) {
        delete next[chordKey];
      } else {
        next[chordKey] = Math.max(1, Math.min(999, Math.round(value)));
      }
      updateSettings({ perChordReps: next });
    },
    [updateSettings, settings.perChordReps]
  );
  const clearPerChordReps = useCallback(
    () => updateSettings({ perChordReps: {} }),
    [updateSettings]
  );
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
  const setGoodThreshold = useCallback(
    (ms: number) => {
      const good = Math.max(100, Math.min(30000, Math.round(ms)));
      const hard = Math.max(good + 100, settings.gradeThresholds.hard);
      updateSettings({ gradeThresholds: { good, hard } });
    },
    [updateSettings, settings.gradeThresholds.hard]
  );
  const setHardThreshold = useCallback(
    (ms: number) => {
      const hard = Math.max(200, Math.min(60000, Math.round(ms)));
      const good = Math.min(hard - 100, settings.gradeThresholds.good);
      updateSettings({ gradeThresholds: { good: Math.max(100, good), hard } });
    },
    [updateSettings, settings.gradeThresholds.good]
  );

  const setAnkiFollow = useCallback(
    (v: boolean) => {
      setAnkiFollowState(v);
      ankiFollowRef.current = v;
      if (!v) {
        ankiDefaultsAppliedRef.current = false;
      }
    },
    []
  );

  const setAutoTimer = useCallback((v: boolean) => {
    setAutoTimerState(v);
    autoTimerRef.current = v;
  }, []);

  const setHideChordUntilGo = useCallback((v: boolean) => {
    setHideChordUntilGoState(v);
  }, []);

  const setStartCountdownEnabled = useCallback((v: boolean) => {
    setStartCountdownEnabledState(v);
  }, []);

  const setAutoGrade = useCallback((v: boolean) => {
    setAutoGradeState(v);
    autoGradeRef.current = v;
  }, []);

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
    heldNotesDisplay,

    mode,
    setMode,
    root,
    setRoot,
    qualityIdx,
    setQualityIdx,
    symbol,
    chordNotes,
    targetPcs,
    familyList: currentQualityList,

    phase: timer.phase,
    liveMs: timer.liveMs,
    countdownValue: timer.countdownValue,
    breakRemaining: timer.breakRemaining,
    running,
    justCompleted,
    repCount,
    repTarget,
    currentRepTarget,
    setRepTarget,
    repTimes,
    startDrill,
    stopDrill,
    nextChord,
    redoChord,

    history,
    resetStats,

    showNotes,
    setShowNotes,
    revealNotesOnFinish,
    setRevealNotesOnFinish,
    requireExactNotes: settings.requireExactNotes,
    setRequireExactNotes,
    celebrateGood: settings.celebrateGood,
    setCelebrateGood,

    perChordRepsEnabled: settings.perChordRepsEnabled,
    setPerChordRepsEnabled,
    perChordReps: settings.perChordReps,
    setPerChordRep,
    clearPerChordReps,

    showNewNotes: settings.showNewNotes,
    setShowNewNotes,
    newCardRepBoost: settings.newCardRepBoost,
    setNewCardRepBoost,
    newCardRepTarget: settings.newCardRepTarget,
    setNewCardRepTarget,
    currentCardQueue,

    ankiFollow,
    setAnkiFollow,
    ankiStatus,
    deckStats,
    autoTimer,
    setAutoTimer,
    countdownSeconds: settings.countdownSeconds,
    setCountdownSeconds,
    hideChordUntilGo,
    setHideChordUntilGo,
    startCountdownEnabled,
    setStartCountdownEnabled,
    breakSeconds: settings.breakSeconds,
    setBreakSeconds,
    breakTickSound: settings.breakTickSound,
    setBreakTickSound,
    autoGrade,
    setAutoGrade,
    gradeThresholds: settings.gradeThresholds,
    setGoodThreshold,
    setHardThreshold,
    gradeStatus,
    lastGradeResult,
    confettiKey,

    shuffleChord,
  };
}
