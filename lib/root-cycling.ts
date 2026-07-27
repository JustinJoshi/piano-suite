/**
 * Root Cycling drill primitives.
 *
 * Drills one fixed chord quality or arpeggio shape across random roots, so the
 * learner tests "can I find this anywhere" rather than "do I know this shape in
 * order". This module is intentionally free of React, DOM, MIDI, and Convex
 * dependencies so it can be unit-tested in isolation.
 */

import {
  type Root,
  ROOTS,
  type Quality,
  SINGLE_QUALITIES,
  normalizePc,
  noteName,
} from "@/lib/music-theory";

export const ROOT_CYCLING_MODES = ["chord", "arpeggio"] as const;
export type RootCyclingMode = (typeof ROOT_CYCLING_MODES)[number];

/** Canonical minor-11th shape transposed to any root. */
export const CANONICAL_ARPEGGIO_LH_INTERVALS = [0, 7];

export type ArpeggioDegree = {
  deg: string;
  iv: number;
};

export const CANONICAL_ARPEGGIO_RH_DEGREES: ArpeggioDegree[] = [
  { deg: "9", iv: 2 },
  { deg: "b3", iv: 3 },
  { deg: "11", iv: 5 },
  { deg: "5", iv: 7 },
  { deg: "b7", iv: 10 },
  { deg: "9", iv: 2 },
  { deg: "11", iv: 5 },
];

export type RootCyclingSettings = {
  mode: RootCyclingMode;
  qualityIdx: number;
  includedPcs: number[];
};

export const ROOT_CYCLING_SETTINGS_KEY = "root-cycling-settings-v1";

export const DEFAULT_ROOT_CYCLING_SETTINGS: RootCyclingSettings = {
  mode: "chord",
  qualityIdx: 2, // m7
  includedPcs: ROOTS.map((r) => r.pc),
};

/**
 * Pick a random root from the included pool, never repeating the same pitch
 * class back-to-back when there are at least two eligible roots.
 */
export function pickRandomRoot(
  includedPcs: number[],
  excludePc: number | null
): number | null {
  const pool = includedPcs.filter((pc) => ROOTS.some((r) => r.pc === pc));
  if (pool.length === 0) return null;
  if (pool.length === 1) return pool[0];
  let choice: number;
  do {
    choice = pool[Math.floor(Math.random() * pool.length)];
  } while (choice === excludePc);
  return choice;
}

/**
 * Get the currently selected quality for chord mode.
 */
export function currentQuality(settings: RootCyclingSettings): Quality {
  return SINGLE_QUALITIES[settings.qualityIdx] ?? SINGLE_QUALITIES[0];
}

/**
 * Build the display symbol for the current chord-mode prompt.
 */
export function chordPromptSymbol(root: Root, quality: Quality): string {
  return `${root.name}${quality.suffix}`;
}

/**
 * Build the pitch-class set for the current chord-mode target.
 */
export function chordTargetPcs(root: Root, quality: Quality): Set<number> {
  return new Set(quality.tones.map((iv) => normalizePc(root.pc + iv)));
}

/**
 * Build the left-hand pedal note names for arpeggio mode at a given root.
 */
export function arpeggioLhNames(root: Root): string[] {
  return CANONICAL_ARPEGGIO_LH_INTERVALS.map((iv) =>
    noteName(root.pc + iv, root.flat)
  );
}

/**
 * Build the right-hand target pitch class for the current sequence index.
 */
export function arpeggioTargetPc(root: Root, targetIdx: number): number {
  const degree = CANONICAL_ARPEGGIO_RH_DEGREES[targetIdx];
  if (!degree) return normalizePc(root.pc);
  return normalizePc(root.pc + degree.iv);
}

/**
 * Get the "from" degree label for an arpeggio transition.
 */
export function arpeggioFromLabel(targetIdx: number, sinceArmFirstNote: boolean): string {
  if (sinceArmFirstNote) return "Root";
  const prev =
    CANONICAL_ARPEGGIO_RH_DEGREES[
      (targetIdx - 1 + CANONICAL_ARPEGGIO_RH_DEGREES.length) %
        CANONICAL_ARPEGGIO_RH_DEGREES.length
    ];
  return prev?.deg ?? "Root";
}

/**
 * Determine the quality suffix stored on a logged chord-mode attempt.
 */
export function qualityFromChordLabel(label: string, rootName: string): string {
  if (label.startsWith(rootName)) return label.slice(rootName.length);
  return label;
}

/**
 * Group key used by the tracking dashboard to aggregate random-root attempts
 * by the fixed idea drilled.
 */
export function rootCyclingGroupKey(
  mode: RootCyclingMode,
  quality?: string,
  fromDeg?: string,
  toDeg?: string
): string {
  if (mode === "chord") {
    return `Chord · ${quality ?? ""}`;
  }
  return `Arpeggio · ${fromDeg ?? ""}→${toDeg ?? ""}`;
}

/**
 * Clamp and validate raw root-cycling settings loaded from persistent storage.
 */
export function normalizeRootCyclingSettings(
  raw: Partial<RootCyclingSettings>
): RootCyclingSettings {
  const mode = ROOT_CYCLING_MODES.includes(raw.mode as RootCyclingMode)
    ? (raw.mode as RootCyclingMode)
    : DEFAULT_ROOT_CYCLING_SETTINGS.mode;

  const rawQualityIdx = Number(raw.qualityIdx);
  const qualityIdx =
    Number.isInteger(rawQualityIdx) &&
    rawQualityIdx >= 0 &&
    rawQualityIdx < SINGLE_QUALITIES.length
      ? rawQualityIdx
      : DEFAULT_ROOT_CYCLING_SETTINGS.qualityIdx;

  let includedPcs = DEFAULT_ROOT_CYCLING_SETTINGS.includedPcs;
  if (Array.isArray(raw.includedPcs)) {
    const valid = raw.includedPcs.filter(
      (pc) => typeof pc === "number" && ROOTS.some((r) => r.pc === pc)
    );
    if (valid.length > 0) includedPcs = valid;
  }

  return { mode, qualityIdx, includedPcs };
}
