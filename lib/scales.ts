/**
 * Scale, mode, and finger-pattern primitives.
 *
 * Kept separate from `lib/music-theory.ts` (a shared hotspot file) so scale
 * work can land without touching chord parsing. Like the rest of the theory
 * layer this module is free of React, DOM, MIDI, and Convex dependencies.
 *
 * A scale is expressed as ascending semitone offsets from the root, *not*
 * including the octave. Callers ask for a span (pentascale / one octave / two
 * octaves), a pattern (straight / thirds / broken triads), and a direction,
 * and get back an ordered list of single-note steps.
 */

import { noteName, normalizePc } from "./music-theory";

export type ScaleDefinition = {
  id: string;
  label: string;
  /** Ascending semitone offsets from the root, excluding the octave. */
  intervals: number[];
};

/**
 * The scales a self-taught pianist is most likely to be told to practice:
 * the seven modes of the major scale, the two altered minors, the two
 * pentatonics, blues, and chromatic.
 */
export const SCALE_TYPES: ScaleDefinition[] = [
  { id: "major", label: "Major (Ionian)", intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: "naturalMinor", label: "Natural minor (Aeolian)", intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: "harmonicMinor", label: "Harmonic minor", intervals: [0, 2, 3, 5, 7, 8, 11] },
  { id: "melodicMinor", label: "Melodic minor", intervals: [0, 2, 3, 5, 7, 9, 11] },
  { id: "dorian", label: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: "phrygian", label: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: "lydian", label: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: "mixolydian", label: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: "locrian", label: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10] },
  { id: "majorPentatonic", label: "Major pentatonic", intervals: [0, 2, 4, 7, 9] },
  { id: "minorPentatonic", label: "Minor pentatonic", intervals: [0, 3, 5, 7, 10] },
  { id: "blues", label: "Blues", intervals: [0, 3, 5, 6, 7, 10] },
  {
    id: "chromatic",
    label: "Chromatic",
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
];

export const SCALE_IDS = SCALE_TYPES.map((s) => s.id);

export const SCALE_SPANS = ["pentascale", "octave", "twoOctaves"] as const;
export type ScaleSpan = (typeof SCALE_SPANS)[number];

export const SCALE_PATTERNS = ["straight", "thirds", "triads"] as const;
export type ScalePattern = (typeof SCALE_PATTERNS)[number];

export const SCALE_DIRECTIONS = ["up", "down", "upDown"] as const;
export type ScaleDirection = (typeof SCALE_DIRECTIONS)[number];

export type ScaleStep = {
  /** Semitones above the root. Can exceed 11 across multi-octave spans. */
  offset: number;
  /** Display name, spelled with the root's accidental preference. */
  name: string;
  /** Scale-degree label ("1".."7"), or "" for notes outside the scale. */
  degree: string;
};

export function scaleDefinition(id: string): ScaleDefinition | null {
  return SCALE_TYPES.find((s) => s.id === id) ?? null;
}

/**
 * Ascending offsets for one span of the scale.
 *
 * `octave` and `twoOctaves` include the top note so the run resolves on the
 * tonic, which is how scales are actually practiced. A pentascale is the
 * first five degrees and deliberately does not resolve.
 */
export function ascendingOffsets(
  intervals: number[],
  span: ScaleSpan
): number[] {
  if (intervals.length === 0) return [];

  if (span === "pentascale") {
    return intervals.slice(0, Math.min(5, intervals.length));
  }

  const one = intervals.slice();
  if (span === "octave") {
    return [...one, 12];
  }
  return [...one, ...one.map((iv) => iv + 12), 24];
}

/**
 * Apply a finger pattern to an ascending run.
 *
 * `thirds` walks in broken thirds (1-3, 2-4, 3-5, …) and `triads` in broken
 * triads (1-3-5, 2-4-6, …), which is the shape most beginner technique books
 * reach for after straight scales. Runs too short for the pattern fall back
 * to straight rather than returning nothing.
 */
export function applyPattern(
  ascending: number[],
  pattern: ScalePattern
): number[] {
  if (pattern === "straight") return ascending;

  const stride = pattern === "thirds" ? 2 : 4;
  if (ascending.length < stride + 1) return ascending;

  const out: number[] = [];
  for (let i = 0; i + stride < ascending.length; i++) {
    if (pattern === "thirds") {
      out.push(ascending[i], ascending[i + 2]);
    } else {
      out.push(ascending[i], ascending[i + 2], ascending[i + 4]);
    }
  }
  return out;
}

/**
 * Apply direction. `upDown` does not repeat the turnaround note, matching how
 * a scale is played rather than how two lists concatenate.
 */
export function applyDirection(
  offsets: number[],
  direction: ScaleDirection
): number[] {
  if (offsets.length === 0) return offsets;
  if (direction === "up") return offsets;
  if (direction === "down") return [...offsets].reverse();
  return [...offsets, ...[...offsets].reverse().slice(1)];
}

function degreeLabel(intervals: number[], offset: number): string {
  const index = intervals.indexOf(normalizePc(offset));
  return index === -1 ? "" : String(index + 1);
}

export type BuildScaleStepsParams = {
  rootPc: number;
  /** Spell accidentals as flats (matches `Root.flat`). */
  useFlats?: boolean;
  scaleId: string;
  span: ScaleSpan;
  pattern: ScalePattern;
  direction: ScaleDirection;
};

/**
 * Build the full ordered run for a scale drill. Returns an empty array for an
 * unknown scale id so callers can render an empty state instead of throwing.
 */
export function buildScaleSteps({
  rootPc,
  useFlats = false,
  scaleId,
  span,
  pattern,
  direction,
}: BuildScaleStepsParams): ScaleStep[] {
  const def = scaleDefinition(scaleId);
  if (!def) return [];

  const offsets = applyDirection(
    applyPattern(ascendingOffsets(def.intervals, span), pattern),
    direction
  );

  return offsets.map((offset) => ({
    offset,
    name: noteName(rootPc + offset, useFlats),
    degree: degreeLabel(def.intervals, offset),
  }));
}

/** Human-readable title for a configured run, e.g. "C Major (Ionian) · 2 oct". */
export function scaleRunLabel(
  rootName: string,
  scaleId: string,
  span: ScaleSpan
): string {
  const def = scaleDefinition(scaleId);
  const spanLabel =
    span === "pentascale" ? "5-finger" : span === "octave" ? "1 oct" : "2 oct";
  return `${rootName} ${def?.label ?? scaleId} · ${spanLabel}`;
}
