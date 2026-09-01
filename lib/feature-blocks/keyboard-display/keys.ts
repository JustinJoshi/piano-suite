/**
 * Pure keyboard geometry for the on-screen keyboard block.
 *
 * White keys are laid out as equal-width flex children; a black key is
 * positioned at the boundary between its neighbouring white keys, expressed
 * as a fraction (0–1) of the container width:
 *
 *   |  C  | D | E | F  | G | A | B |
 *      ^   ^
 *    C#/D# sit on the C|D and D|E boundaries.
 */

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

const isBlackPc = (pc: number): boolean =>
  pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10;

/**
 * Classic one-octave-plus computer-key mapping, chromatic from the lowest
 * key (which should be a C for the home-row alignment to feel right):
 * a w s e d f t g y h u j k o l p ; '
 */
const CHROMATIC_KEYCAPS = [
  "a",
  "w",
  "s",
  "e",
  "d",
  "f",
  "t",
  "g",
  "y",
  "h",
  "u",
  "j",
  "k",
  "o",
  "l",
  "p",
  ";",
  "'",
] as const;

export function isBlackNote(note: number): boolean {
  return isBlackPc(((note % 12) + 12) % 12);
}

export function noteName(note: number): string {
  return NOTE_NAMES[((note % 12) + 12) % 12];
}

/** Computer-keyboard cap for a chromatic offset from the lowest key. */
export function computerKeyForOffset(offset: number): string | null {
  return CHROMATIC_KEYCAPS[offset] ?? null;
}

export type WhiteKey = {
  note: number;
  name: string;
  keyCap: string | null;
};

export type BlackKey = {
  note: number;
  name: string;
  keyCap: string | null;
  /** Left edge as a fraction (0–1) of the white-key row width. */
  leftFraction: number;
};

export type KeyboardLayout = {
  whiteKeys: WhiteKey[];
  blackKeys: BlackKey[];
};

/**
 * Build the layout for a MIDI note range. `leftFraction` for a black key is
 * the index of the white key to its right divided by the white-key count,
 * so `left: ${leftFraction * 100}%` centers it on the boundary.
 */
export function buildKeyboardLayout(
  lowNote: number,
  keyCount: number
): KeyboardLayout {
  const whiteNotes: number[] = [];
  const blackNotes: number[] = [];

  for (let note = lowNote; note < lowNote + keyCount; note += 1) {
    if (isBlackNote(note)) {
      blackNotes.push(note);
    } else {
      whiteNotes.push(note);
    }
  }

  const whiteKeys: WhiteKey[] = whiteNotes.map((note) => ({
    note,
    name: noteName(note),
    keyCap: computerKeyForOffset(note - lowNote),
  }));

  const whiteCount = Math.max(whiteNotes.length, 1);

  const blackKeys: BlackKey[] = blackNotes.map((note) => {
    // How many white keys lie strictly below this note in the range?
    // That count is the index of the white key to its right.
    const whitesBelow = whiteNotes.filter((w) => w < note).length;
    return {
      note,
      name: noteName(note),
      keyCap: computerKeyForOffset(note - lowNote),
      leftFraction: whitesBelow / whiteCount,
    };
  });

  return { whiteKeys, blackKeys };
}
