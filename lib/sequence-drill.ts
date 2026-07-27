/**
 * Generic sequence-drill primitives for two-phase hand-separated drills.
 *
 * A sequence drill has:
 * - A left-hand "pedal" pattern that must be held to arm the drill.
 * - A right-hand note sequence that must be played in order.
 *
 * This module is intentionally free of React, DOM, MIDI, and Convex
 * dependencies so it can be unit-tested in isolation and reused by future
 * custom drills.
 */

import { normalizePc, SHARP_NAMES } from "@/lib/music-theory";

export type SequenceNote = {
  /** Display name for the note. */
  name: string;
  /** Pitch class (0–11). */
  pc: number;
  /** Optional scale-degree label (e.g. "9", "b3", "11"). */
  deg?: string;
};

export type SequenceDrill = {
  /** Unique identifier for the drill (e.g. "Bbm11"). */
  id: string;
  /** Left-hand notes that must all be held to begin the sequence. */
  lh: SequenceNote[];
  /** Right-hand sequence to play in order. */
  rh: SequenceNote[];
};

export type SequenceConfig = {
  /** Ordered list of all drill ids. */
  order: string[];
  /** Ids that should be skipped. */
  excluded: string[];
};

export type MissThresholds = {
  /** Maximum misses for a "Good" grade. */
  good: number;
  /** Maximum misses for a "Hard" grade. */
  hard: number;
};

export type GradeResult = {
  ease: 1 | 2 | 3;
  label: "Again" | "Hard" | "Good";
};

/**
 * Get the sharp-spelled display name for a pitch class.
 */
export function noteNameForPc(pc: number): string {
  return SHARP_NAMES[normalizePc(pc)];
}

/**
 * Filter the ordered list to only included (non-excluded) drills.
 */
export function activeSequence(config: SequenceConfig): string[] {
  return config.order.filter((id) => !config.excluded.includes(id));
}

/**
 * Look up the current drill from the active sequence.
 */
export function currentChord(
  chords: SequenceDrill[],
  config: SequenceConfig,
  index: number
): SequenceDrill | null {
  const seq = activeSequence(config);
  if (!seq.length) return null;
  const id = seq[index % seq.length];
  return chords.find((c) => c.id === id) ?? null;
}

/**
 * Determine the "from" degree label for the current transition.
 *
 * Returns "Root" only for the very first note played after arming. After that
 * it returns the degree of the previously-played note, including across lap
 * wraparounds.
 */
export function currentFromLabel(
  chord: SequenceDrill,
  targetIdx: number,
  sinceArmFirstNote: boolean
): string {
  if (sinceArmFirstNote) return "Root";
  const prev = chord.rh[(targetIdx - 1 + chord.rh.length) % chord.rh.length];
  return prev.deg ?? prev.name;
}

/**
 * Grade a completed lap based on the number of missed notes.
 */
export function gradeForMisses(
  misses: number,
  thresholds: MissThresholds
): GradeResult {
  if (misses <= thresholds.good) return { ease: 3, label: "Good" };
  if (misses <= thresholds.hard) return { ease: 2, label: "Hard" };
  return { ease: 1, label: "Again" };
}

/**
 * Validate and normalize a sequence configuration.
 */
export function normalizeSequenceConfig(
  order: string[] | undefined,
  defaultOrder: string[]
): SequenceConfig {
  const validOrder =
    Array.isArray(order) && order.length === defaultOrder.length &&
    order.every((id) => defaultOrder.includes(id))
      ? order
      : defaultOrder.slice();

  return {
    order: validOrder,
    excluded: [],
  };
}
