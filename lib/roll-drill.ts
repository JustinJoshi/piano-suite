/**
 * The landing page's four-chord drill: I–V–vi–IV in C.
 *
 * It checks which pitch classes are sounding, in any octave and any order,
 * and nothing else — the same promise every drill in the app makes. A note
 * let go of keeps counting for `CHORD_WINDOW_MS`, so a mouse, which can only
 * hold one key, can still play a chord by clicking the notes in turn.
 */

export const CHORD_WINDOW_MS = 1500;
export const HINT_AFTER_MS = 4500;

export type RollDrillTarget = {
  /** "C major" */
  name: string;
  /** "C" — used in the ledger. */
  short: string;
  /** Note names, in chord order: ["C", "E", "G"]. */
  spell: string[];
  /** Pitch classes, same order as `spell`. */
  pcs: number[];
  /** One voicing inside the on-screen range, for the hint dots. */
  hint: number[];
};

export const ROLL_DRILL_TARGETS: RollDrillTarget[] = [
  { name: "C major", short: "C", spell: ["C", "E", "G"], pcs: [0, 4, 7], hint: [60, 64, 67] },
  { name: "G major", short: "G", spell: ["G", "B", "D"], pcs: [7, 11, 2], hint: [67, 71, 74] },
  { name: "A minor", short: "Am", spell: ["A", "C", "E"], pcs: [9, 0, 4], hint: [69, 72, 76] },
  { name: "F major", short: "F", spell: ["F", "A", "C"], pcs: [5, 9, 0], hint: [65, 69, 72] },
];

export const pitchClass = (note: number) => ((note % 12) + 12) % 12;

/**
 * The pitch classes that count right now: every held note, plus every note
 * released less than the chord window ago.
 */
export function activePitchClasses(
  held: Iterable<number>,
  released: ReadonlyMap<number, number>,
  now: number,
  windowMs = CHORD_WINDOW_MS
): Set<number> {
  const pcs = new Set<number>();
  for (const note of held) pcs.add(pitchClass(note));
  for (const [note, at] of released) {
    if (now - at < windowMs) pcs.add(pitchClass(note));
  }
  return pcs;
}

/** A target is played when all of its pitch classes sound and nothing else does. */
export function isTargetPlayed(target: RollDrillTarget, active: ReadonlySet<number>): boolean {
  if (!target.pcs.every((pc) => active.has(pc))) return false;
  for (const pc of active) if (!target.pcs.includes(pc)) return false;
  return true;
}

/** A pressed note is a miss when its pitch class isn't in the chord. */
export function isMiss(target: RollDrillTarget, note: number): boolean {
  return !target.pcs.includes(pitchClass(note));
}

export type RollDrillResult = { name: string; ms: number; misses: number };

export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

export function spokenSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} seconds`;
}

export function missWords(n: number): string {
  if (n === 0) return "no misses";
  if (n === 1) return "one miss";
  return `${n} misses`;
}

export function summarize(results: RollDrillResult[]): { totalMs: number; misses: number } {
  return {
    totalMs: results.reduce((sum, r) => sum + r.ms, 0),
    misses: results.reduce((sum, r) => sum + r.misses, 0),
  };
}
