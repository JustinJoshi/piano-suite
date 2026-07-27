/**
 * Progression-drill primitives for looping chord progressions.
 *
 * A progression is an ordered list of steps, each with a root and quality.
 * The engine loops through the steps, timing each chord transition.
 *
 * This module is intentionally free of React, DOM, MIDI, and Convex
 * dependencies so it can be unit-tested in isolation and reused by future
 * custom user-authored progressions.
 */

import { type Root, ROOTS, type Quality, FAMILY, normalizePc } from "@/lib/music-theory";

export const PROGRESSION_TYPES = ["ii-V-I", "blues12"] as const;
export type ProgressionType = (typeof PROGRESSION_TYPES)[number];

/** Original Reflex Drill EXT supported C, G, D, A, E. */
export const PROGRESSION_KEYS = ROOTS.filter((r) =>
  ["C", "G", "D", "A", "E"].includes(r.name)
);

const MAJ7 = FAMILY[0];
const DOM7 = FAMILY[1];
const M7 = FAMILY[2];

export type ProgressionStep = {
  /** Functional label, e.g. "ii" or "bar 5". */
  label: string;
  root: Root;
  quality: Quality;
};

export type Progression = {
  type: ProgressionType;
  label: string;
  steps: ProgressionStep[];
};

export type ProgressionHistoryEntry = {
  bestStepMs: number;
  bestAvgMs: number;
  totalLoops: number;
};

export type ProgressionHistory = Record<string, ProgressionHistoryEntry>;

export type ProgressionSettings = {
  progressionType: ProgressionType;
  keyPc: number;
  ankiFlip: boolean;
  stepChime: boolean;
  loopChime: boolean;
};

export const DEFAULT_PROGRESSION_SETTINGS: ProgressionSettings = {
  progressionType: "ii-V-I",
  keyPc: 0,
  ankiFlip: false,
  stepChime: true,
  loopChime: true,
};

export const PROGRESSION_SETTINGS_KEY = "progression-settings-v1";
export const PROGRESSION_HISTORY_KEY = "progression-history-v1";

function rootForPc(pc: number): Root {
  const root = ROOTS.find((r) => r.pc === normalizePc(pc));
  if (!root) throw new Error(`No root for pitch class ${pc}`);
  return root;
}

/**
 * Build a ii-V-I progression in the given key.
 */
export function buildIiVI(keyRootPc: number): ProgressionStep[] {
  const key = normalizePc(keyRootPc);
  const ii = normalizePc(key + 2);
  const V = normalizePc(key + 7);
  const I = key;
  return [
    { label: "ii", root: rootForPc(ii), quality: M7 },
    { label: "V", root: rootForPc(V), quality: DOM7 },
    { label: "I", root: rootForPc(I), quality: MAJ7 },
  ];
}

/**
 * Build a 12-bar blues progression in the given key.
 */
export function buildBlues12(keyRootPc: number): ProgressionStep[] {
  const key = normalizePc(keyRootPc);
  const I = key;
  const IV = normalizePc(key + 5);
  const V = normalizePc(key + 7);
  const seq = [I, I, I, I, IV, IV, I, I, V, IV, I, I];
  return seq.map((rootPc, i) => ({
    label: `bar ${i + 1}`,
    root: rootForPc(rootPc),
    quality: DOM7,
  }));
}

/**
 * Build the full progression object for a type + key.
 */
export function buildProgression(
  type: ProgressionType,
  keyRootPc: number
): Progression {
  const key = ROOTS.find((r) => r.pc === normalizePc(keyRootPc)) ?? ROOTS[0];
  const steps = type === "ii-V-I" ? buildIiVI(key.pc) : buildBlues12(key.pc);
  return {
    type,
    label: type === "ii-V-I" ? "ii-V-I" : "12-Bar Blues",
    steps,
  };
}

/**
 * Render a chord symbol for a progression step.
 */
export function chordSymbol(step: ProgressionStep): string {
  return `${step.root.name}${step.quality.suffix}`;
}

/**
 * Get the matching right-hand scale name for a quality.
 */
export function scaleName(quality: Quality): string {
  if (quality.suffix === "m7") return "Dorian";
  if (quality.suffix === "7") return "Mixolydian";
  if (quality.suffix === "maj7") return "Ionian";
  return "";
}

/**
 * Storage key for history entries, matching the original format.
 */
export function historyKey(type: ProgressionType, keyName: string): string {
  return `${type}-${keyName}`;
}

/**
 * Update rolling-best history after a completed loop.
 */
export function updateProgressionHistory(
  history: ProgressionHistory,
  type: ProgressionType,
  keyName: string,
  stepTimes: number[]
): ProgressionHistory {
  if (stepTimes.length === 0) return history;

  const key = historyKey(type, keyName);
  const prev = history[key] ?? {
    bestStepMs: Infinity,
    bestAvgMs: Infinity,
    totalLoops: 0,
  };

  const avg = stepTimes.reduce((a, b) => a + b, 0) / stepTimes.length;
  const best = Math.min(...stepTimes);

  return {
    ...history,
    [key]: {
      bestStepMs: Math.min(prev.bestStepMs, Math.round(best)),
      bestAvgMs: Math.min(prev.bestAvgMs, Math.round(avg)),
      totalLoops: prev.totalLoops + 1,
    },
  };
}

/**
 * Clamp and validate raw progression settings loaded from persistent storage.
 */
export function normalizeProgressionSettings(
  raw: Partial<ProgressionSettings>
): ProgressionSettings {
  const type = PROGRESSION_TYPES.includes(raw.progressionType as ProgressionType)
    ? (raw.progressionType as ProgressionType)
    : DEFAULT_PROGRESSION_SETTINGS.progressionType;

  const validKeyPc = PROGRESSION_KEYS.some((r) => r.pc === raw.keyPc)
    ? raw.keyPc!
    : DEFAULT_PROGRESSION_SETTINGS.keyPc;

  return {
    progressionType: type,
    keyPc: validKeyPc,
    ankiFlip:
      typeof raw.ankiFlip === "boolean"
        ? raw.ankiFlip
        : DEFAULT_PROGRESSION_SETTINGS.ankiFlip,
    stepChime:
      typeof raw.stepChime === "boolean"
        ? raw.stepChime
        : DEFAULT_PROGRESSION_SETTINGS.stepChime,
    loopChime:
      typeof raw.loopChime === "boolean"
        ? raw.loopChime
        : DEFAULT_PROGRESSION_SETTINGS.loopChime,
  };
}
