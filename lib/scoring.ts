/**
 * Scoring primitives for comparing held MIDI notes against target chords
 * and sequences.
 */

import { normalizePc } from "@/lib/music-theory";


/**
 * Convert a list of MIDI note numbers to a pitch-class set.
 */
export function pitchClassSetOf(notes: number[]): Set<number> {
  return new Set(notes.map((n) => ((n % 12) + 12) % 12));
}

/**
 * Compare two pitch-class sets for equality.
 */
export function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) {
    if (!b.has(x)) return false;
  }
  return true;
}

/**
 * Check whether every pitch class in `target` is present in `played`.
 */
export function isSubset(target: Set<number>, played: Set<number>): boolean {
  for (const x of target) {
    if (!played.has(x)) return false;
  }
  return true;
}

export type ChordAttemptResult = {
  correct: boolean;
  missing: number[];
  extra: number[];
};

/**
 * Evaluate a held chord against a target pitch-class set.
 *
 * When `requireExact` is true, any extra notes make the attempt fail.
 * When false, extra notes are allowed as long as all target notes are present.
 */
export function evaluateChordAttempt(
  targetPcs: Set<number>,
  heldPcs: Set<number>,
  options: { requireExact?: boolean } = {}
): ChordAttemptResult {
  const { requireExact = true } = options;

  const missing: number[] = [];
  for (const pc of targetPcs) {
    if (!heldPcs.has(pc)) missing.push(pc);
  }

  const extra: number[] = [];
  for (const pc of heldPcs) {
    if (!targetPcs.has(pc)) extra.push(pc);
  }

  const hasAll = missing.length === 0;
  const correct = requireExact ? hasAll && extra.length === 0 : hasAll;

  return { correct, missing, extra };
}

export type SequenceAttemptResult =
  | {
      correct: true;
      expected: number;
      played: number;
      nextIndex: number;
    }
  | {
      correct: false;
      expected: number;
      played: number | null;
      nextIndex: number;
    };

/**
 * Evaluate the next note in a sequence against currently held notes.
 *
 * Returns whether any held note matches the expected target, and what the
 * next index in the sequence should be. If no note is held, `played` is null.
 */
export function evaluateSequenceAttempt(
  targetSequence: number[],
  heldNotes: number[],
  currentIndex: number
): SequenceAttemptResult {
  if (currentIndex < 0 || currentIndex >= targetSequence.length) {
    throw new Error(
      `Sequence index out of bounds: ${currentIndex} (length ${targetSequence.length})`
    );
  }

  const expected = normalizePc(targetSequence[currentIndex]);
  const heldPcs = pitchClassSetOf(heldNotes);

  if (heldPcs.has(expected)) {
    return {
      correct: true,
      expected,
      played: expected,
      nextIndex: currentIndex + 1,
    };
  }

  const played = heldNotes.length > 0 ? heldNotes[0] : null;
  return {
    correct: false,
    expected,
    played,
    nextIndex: currentIndex,
  };
}
