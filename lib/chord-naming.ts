/**
 * Name whatever is held down: a single note ("C4"), an interval ("Major
 * 3rd"), or a chord symbol ("Cmaj7", "Am7/C").
 *
 * Pure and React-free. Used by the playable landing keybed to answer a
 * visitor who presses a few keys; deliberately small — triads, sevenths,
 * sixths, suspensions, and the common ninths — so it never guesses at an
 * exotic name for a cluster.
 */
import { noteName, normalizePc, ROOTS } from "@/lib/music-theory";

export type HeldNotesName = {
  /** The headline: "C4", "Major 3rd", "Cmaj7", "C/E". */
  symbol: string;
  /** Pitch classes in the order played from the bass up, spelled for the key. */
  notes: string[];
  kind: "note" | "interval" | "chord" | "cluster";
};

type ChordTemplate = { suffix: string; intervals: readonly number[] };

// Ordered from most to least common so ties resolve to the familiar name.
const CHORD_TEMPLATES: readonly ChordTemplate[] = [
  { suffix: "", intervals: [0, 4, 7] },
  { suffix: "m", intervals: [0, 3, 7] },
  { suffix: "maj7", intervals: [0, 4, 7, 11] },
  { suffix: "7", intervals: [0, 4, 7, 10] },
  { suffix: "m7", intervals: [0, 3, 7, 10] },
  { suffix: "6", intervals: [0, 4, 7, 9] },
  { suffix: "m6", intervals: [0, 3, 7, 9] },
  { suffix: "m7b5", intervals: [0, 3, 6, 10] },
  { suffix: "dim7", intervals: [0, 3, 6, 9] },
  { suffix: "dim", intervals: [0, 3, 6] },
  { suffix: "aug", intervals: [0, 4, 8] },
  { suffix: "sus4", intervals: [0, 5, 7] },
  { suffix: "sus2", intervals: [0, 2, 7] },
  { suffix: "7sus4", intervals: [0, 5, 7, 10] },
  { suffix: "m(maj7)", intervals: [0, 3, 7, 11] },
  { suffix: "add9", intervals: [0, 2, 4, 7] },
  { suffix: "9", intervals: [0, 2, 4, 7, 10] },
  { suffix: "maj9", intervals: [0, 2, 4, 7, 11] },
  { suffix: "m9", intervals: [0, 2, 3, 7, 10] },
];

const INTERVAL_NAMES = [
  "Unison",
  "Minor 2nd",
  "Major 2nd",
  "Minor 3rd",
  "Major 3rd",
  "Perfect 4th",
  "Tritone",
  "Perfect 5th",
  "Minor 6th",
  "Major 6th",
  "Minor 7th",
  "Major 7th",
];

/** Whether a root is conventionally spelled with flats (Db, Eb, Ab, Bb, F). */
function prefersFlats(pc: number): boolean {
  return ROOTS.find((root) => root.pc === normalizePc(pc))?.flat ?? false;
}

/** MIDI note → scientific pitch name, middle C (60) = C4. */
export function midiNoteName(note: number, useFlats = false): string {
  const octave = Math.floor(note / 12) - 1;
  return `${noteName(note, useFlats)}${octave}`;
}

function sameSet(a: readonly number[], b: Set<number>): boolean {
  return a.length === b.size && a.every((value) => b.has(value));
}

/**
 * Name the held notes, or `null` when nothing is held.
 *
 * The lowest note is preferred as the root; when a chord only matches from
 * another root, it is named as an inversion with a slash bass ("C/E").
 */
export function nameHeldNotes(
  held: readonly number[]
): HeldNotesName | null {
  const notes = [...new Set(held)]
    .filter((note) => Number.isInteger(note))
    .sort((a, b) => a - b);
  if (notes.length === 0) return null;

  const bass = notes[0];
  const pcsInOrder: number[] = [];
  for (const note of notes) {
    const pc = normalizePc(note);
    if (!pcsInOrder.includes(pc)) pcsInOrder.push(pc);
  }

  if (notes.length === 1) {
    const flats = prefersFlats(bass);
    return {
      symbol: midiNoteName(bass, flats),
      notes: [noteName(bass, flats)],
      kind: "note",
    };
  }

  if (pcsInOrder.length === 1) {
    const flats = prefersFlats(bass);
    return {
      symbol: `${noteName(bass, flats)} octaves`,
      notes: [noteName(bass, flats)],
      kind: "interval",
    };
  }

  if (pcsInOrder.length === 2) {
    const semitones = normalizePc(pcsInOrder[1] - pcsInOrder[0]);
    const flats = prefersFlats(bass);
    return {
      symbol: INTERVAL_NAMES[semitones],
      notes: pcsInOrder.map((pc) => noteName(pc, flats)),
      kind: "interval",
    };
  }

  const pcs = new Set(pcsInOrder);
  // Root candidates in bass-up order: the bass wins whenever any template
  // fits it, so C–E–G–A reads as C6 and A–C–E–G as Am7.
  for (const root of pcsInOrder) {
    for (const template of CHORD_TEMPLATES) {
      const relative = new Set([...pcs].map((pc) => normalizePc(pc - root)));
      if (!sameSet(template.intervals, relative)) continue;

      const flats = prefersFlats(root);
      const rootName = noteName(root, flats);
      const bassPc = pcsInOrder[0];
      const slash =
        bassPc === root ? "" : `/${noteName(bassPc, prefersFlats(root))}`;
      return {
        symbol: `${rootName}${template.suffix}${slash}`,
        notes: pcsInOrder.map((pc) => noteName(pc, flats)),
        kind: "chord",
      };
    }
  }

  const flats = prefersFlats(bass);
  return {
    symbol: pcsInOrder.map((pc) => noteName(pc, flats)).join(" "),
    notes: pcsInOrder.map((pc) => noteName(pc, flats)),
    kind: "cluster",
  };
}
