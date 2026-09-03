/**
 * Pure free-play analysis. Improvisation has no misses, so the runtime's
 * target/hit/miss vocabulary does not apply; these functions characterize
 * what was played instead of grading it.
 */

import { scaleDefinition } from "../../scales";
import { parseRoot } from "../../music-theory";

export type PitchRange = { low: number; high: number; span: number };

/** Fraction of pitch classes that sit inside the scale. Empty input → 1. */
export function inScaleRatio(pcs: Iterable<number>, scalePcs: Set<number>): number {
  const list = [...pcs];
  if (list.length === 0) return 1;
  let inside = 0;
  for (const pc of list) {
    if (scalePcs.has(pc)) inside += 1;
  }
  return inside / list.length;
}

/** Low, high, and span (semitones) of the played notes. Null when empty. */
export function pitchRange(midi: number[]): PitchRange | null {
  if (midi.length === 0) return null;
  const low = Math.min(...midi);
  const high = Math.max(...midi);
  return { low, high, span: high - low };
}

/** Notes per second over a rolling window ending at `nowMs`. */
export function notesPerSecond(
  timestamps: number[],
  windowMs: number,
  nowMs: number
): number {
  const cutoff = nowMs - windowMs;
  const inWindow = timestamps.filter((t) => t > cutoff && t <= nowMs);
  return inWindow.length / (windowMs / 1000);
}

/** Count of each pitch class played, for a small histogram. */
export function pcHistogram(midi: number[]): Map<number, number> {
  const histogram = new Map<number, number>();
  for (const note of midi) {
    const pc = ((note % 12) + 12) % 12;
    histogram.set(pc, (histogram.get(pc) ?? 0) + 1);
  }
  return histogram;
}

/** Pitch classes of a scale at a root, for the in-scale check. */
export function scalePcsFor(scaleId: string, rootName: string): Set<number> {
  const def = scaleDefinition(scaleId);
  const root = parseRoot(rootName);
  if (!def || !root) return new Set();
  return new Set(def.intervals.map((iv) => ((root.pc + iv) % 12 + 12) % 12));
}
