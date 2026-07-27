/**
 * Pure chord-drill helpers shared between the engine hook and the UI.
 *
 * This module is intentionally free of React, DOM, MIDI, and Convex
 * dependencies so it can be unit-tested in isolation.
 */

import { type AnkiCardQueue } from "@/lib/anki";

export type ChordDrillMode = "single" | "family" | "extended";

export type GradeThresholds = {
  good: number; // ms
  hard: number; // ms
};

export type ChordDrillSettings = {
  mode: ChordDrillMode;
  repTarget: number;
  showNotes: boolean;
  requireExactNotes: boolean;
  revealNotesOnFinish: boolean;
  celebrateGood: boolean;
  showNewNotes: boolean;
  newCardRepBoost: boolean;
  newCardRepTarget: number;
  perChordRepsEnabled: boolean;
  perChordReps: Record<string, number>;
  countdownSeconds: number;
  breakSeconds: number;
  breakTickSound: boolean;
  gradeThresholds: GradeThresholds;
};

export const DEFAULT_CHORD_DRILL_SETTINGS: ChordDrillSettings = {
  mode: "single",
  repTarget: 12,
  showNotes: false,
  requireExactNotes: true,
  revealNotesOnFinish: false,
  celebrateGood: true,
  showNewNotes: false,
  newCardRepBoost: false,
  newCardRepTarget: 20,
  perChordRepsEnabled: false,
  perChordReps: {},
  countdownSeconds: 3,
  breakSeconds: 0,
  breakTickSound: true,
  gradeThresholds: { good: 2000, hard: 4000 },
};

export const CHORD_DRILL_SETTINGS_KEY = "chord-drill-settings-v1";
export const CHORD_DRILL_HISTORY_KEY = "chord-drill-history-v1";

export type GradeResult = {
  ease: 1 | 2 | 3;
  label: "Again" | "Hard" | "Good";
};

/**
 * Map a first-chord reaction time to an Anki ease rating.
 */
export function gradeForTime(
  ms: number,
  thresholds: GradeThresholds
): GradeResult {
  if (ms < thresholds.good) return { ease: 3, label: "Good" };
  if (ms < thresholds.hard) return { ease: 2, label: "Hard" };
  return { ease: 1, label: "Again" };
}

export type EffectiveRepTargetOptions = {
  chordKey: string;
  baseTarget: number;
  perChordRepsEnabled: boolean;
  perChordReps: Record<string, number>;
  newCardRepBoost: boolean;
  newCardRepTarget: number;
  currentCardQueue: AnkiCardQueue;
};

/**
 * Determine the rep target that should be used for the current/forthcoming
 * round, taking per-chord overrides and Anki new-card boosts into account.
 */
export function effectiveRepTarget(options: EffectiveRepTargetOptions): number {
  const {
    chordKey,
    baseTarget,
    perChordRepsEnabled,
    perChordReps,
    newCardRepBoost,
    newCardRepTarget,
    currentCardQueue,
  } = options;

  if (perChordRepsEnabled && chordKey) {
    const val = perChordReps[chordKey];
    if (Number.isFinite(Number(val)) && Number(val) >= 1) return Number(val);
  }

  if (newCardRepBoost && currentCardQueue === "new") {
    return newCardRepTarget;
  }

  return baseTarget;
}

export type ChordHistory = {
  bestAvgMs: number;
  bestSingleMs: number;
  bestFirstPressMs: number;
  totalReps: number;
};

export type ChordDrillHistory = Record<string, ChordHistory>;

/**
 * Update rolling-best history after a completed round.
 */
export function updateHistory(
  history: ChordDrillHistory,
  chordKey: string,
  times: number[]
): ChordDrillHistory {
  if (times.length === 0) return history;

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const best = Math.min(...times);
  const first = times[0];

  const prev = history[chordKey] ?? {
    bestAvgMs: Infinity,
    bestSingleMs: Infinity,
    bestFirstPressMs: Infinity,
    totalReps: 0,
  };

  return {
    ...history,
    [chordKey]: {
      bestAvgMs: Math.min(prev.bestAvgMs, Math.round(avg)),
      bestSingleMs: Math.min(prev.bestSingleMs, Math.round(best)),
      bestFirstPressMs: Math.min(prev.bestFirstPressMs, Math.round(first)),
      totalReps: prev.totalReps + times.length,
    },
  };
}

/**
 * Clamp and validate raw settings loaded from persistent storage.
 */
export function normalizeSettings(
  raw: Partial<ChordDrillSettings>
): ChordDrillSettings {
  const clamp = (n: unknown, min: number, max: number, fallback: number) => {
    const val = Number(n);
    return Number.isFinite(val) ? Math.max(min, Math.min(max, val)) : fallback;
  };

  const thresholds: GradeThresholds = {
    good: clamp(raw.gradeThresholds?.good, 100, 30000, 2000),
    hard: clamp(raw.gradeThresholds?.hard, 200, 60000, 4000),
  };

  if (thresholds.good >= thresholds.hard) {
    thresholds.hard = thresholds.good + 100;
  }

  return {
    mode: ["single", "family", "extended"].includes(raw.mode as string)
      ? (raw.mode as ChordDrillMode)
      : DEFAULT_CHORD_DRILL_SETTINGS.mode,
    repTarget: clamp(raw.repTarget, 1, 999, DEFAULT_CHORD_DRILL_SETTINGS.repTarget),
    showNotes: typeof raw.showNotes === "boolean" ? raw.showNotes : DEFAULT_CHORD_DRILL_SETTINGS.showNotes,
    requireExactNotes: typeof raw.requireExactNotes === "boolean" ? raw.requireExactNotes : DEFAULT_CHORD_DRILL_SETTINGS.requireExactNotes,
    revealNotesOnFinish: typeof raw.revealNotesOnFinish === "boolean" ? raw.revealNotesOnFinish : DEFAULT_CHORD_DRILL_SETTINGS.revealNotesOnFinish,
    celebrateGood: typeof raw.celebrateGood === "boolean" ? raw.celebrateGood : DEFAULT_CHORD_DRILL_SETTINGS.celebrateGood,
    showNewNotes: typeof raw.showNewNotes === "boolean" ? raw.showNewNotes : DEFAULT_CHORD_DRILL_SETTINGS.showNewNotes,
    newCardRepBoost: typeof raw.newCardRepBoost === "boolean" ? raw.newCardRepBoost : DEFAULT_CHORD_DRILL_SETTINGS.newCardRepBoost,
    newCardRepTarget: clamp(raw.newCardRepTarget, 1, 999, DEFAULT_CHORD_DRILL_SETTINGS.newCardRepTarget),
    perChordRepsEnabled: typeof raw.perChordRepsEnabled === "boolean" ? raw.perChordRepsEnabled : DEFAULT_CHORD_DRILL_SETTINGS.perChordRepsEnabled,
    perChordReps: raw.perChordReps && typeof raw.perChordReps === "object" && !Array.isArray(raw.perChordReps)
      ? raw.perChordReps as Record<string, number>
      : {},
    countdownSeconds: clamp(raw.countdownSeconds, 1, 30, DEFAULT_CHORD_DRILL_SETTINGS.countdownSeconds),
    breakSeconds: clamp(raw.breakSeconds, 0, 60, DEFAULT_CHORD_DRILL_SETTINGS.breakSeconds),
    breakTickSound: typeof raw.breakTickSound === "boolean" ? raw.breakTickSound : DEFAULT_CHORD_DRILL_SETTINGS.breakTickSound,
    gradeThresholds: thresholds,
  };
}

/**
 * Clamp a per-chord rep override to a valid range.
 */
export function clampRepOverride(n: number): number {
  return Math.max(1, Math.min(999, Math.round(n)));
}
