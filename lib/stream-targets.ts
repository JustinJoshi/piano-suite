/**
 * Pure, deterministic adapter: composed PracticeNote[] stream → ChordTarget[].
 *
 * Type-only import of the runtime shape keeps this module Convex-reachable-safe
 * (no React, no build-stream imports).
 */

import type { ChordTarget } from "./drill-runtime";
import type { PracticeNote } from "./practice-note";
import { normalizePc, noteName } from "./music-theory";

/** Accompaniment markers in uploaded streams are never playable targets. */
const ACCOMPANIMENT_SYMBOL = "acc";

/**
 * Stable logical identity for a target list: ordered pitch-class sets and
 * labels only — never absolute milliseconds, so a tempo change preserves it.
 */
export function streamTargetsIdentity(
  targets: readonly ChordTarget[]
): string {
  return targets
    .map(
      (t) =>
        `${t.symbol}:[${[...t.pcs].sort((a, b) => a - b).join(",")}]:[${t.notes.join(",")}]`
    )
    .join("|");
}

function isPlayable(note: PracticeNote): boolean {
  if (note.symbol === ACCOMPANIMENT_SYMBOL) return false;
  return note.pcs.size > 0;
}

function labelOf(note: PracticeNote): string {
  if (note.symbol) return note.symbol;
  return noteName(normalizePc(note.midi[0] ?? 0));
}

function makeTarget(label: string, note: PracticeNote): ChordTarget {
  const pcs = new Set<number>();
  for (const pc of note.pcs) pcs.add(normalizePc(pc));
  const sorted = [...pcs].sort((a, b) => a - b);
  return {
    id: `${label}:${sorted.join(",")}`,
    symbol: label,
    notes: sorted.map((pc) => noteName(pc)),
    pcs,
  };
}

/**
 * Convert a composed practice stream into ordered drill targets.
 *
 * - Untimed notes stay distinct, including repeated identical chords.
 * - Consecutive timed notes at the same onset merge into one target.
 * - A timed note whose onset drops below the previous onset begins a new
 *   ordered source run, so same-onset notes never merge across that boundary.
 * - Empty pitch sets and accompaniment markers are skipped.
 * - Source order is preserved; existing symbols win over derived names.
 */
export function targetsFromStream(
  notes: readonly PracticeNote[]
): ChordTarget[] {
  const targets: ChordTarget[] = [];
  const groupOnsets: (number | null)[] = [];

  let lastOnset: number | null = null;

  for (const note of notes) {
    if (!isPlayable(note)) continue;

    if (note.onsetMs === undefined) {
      lastOnset = null;
      targets.push(makeTarget(labelOf(note), note));
      groupOnsets.push(null);
      continue;
    }

    if (lastOnset !== null && note.onsetMs < lastOnset) {
      // The source timeline restarted: same-onset notes across this boundary
      // belong to different ordered runs and must not merge.
      groupOnsets[groupOnsets.length - 1] = null;
    }
    lastOnset = note.onsetMs;

    if (groupOnsets[groupOnsets.length - 1] === note.onsetMs) {
      const last = targets[targets.length - 1];
      for (const pc of note.pcs) last.pcs.add(normalizePc(pc));
      last.notes = [...last.pcs].sort((a, b) => a - b).map((pc) => noteName(pc));
      continue;
    }

    targets.push(makeTarget(labelOf(note), note));
    groupOnsets.push(note.onsetMs);
  }

  return targets;
}
