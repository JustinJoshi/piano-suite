/**
 * Music theory primitives shared across all Piano Suite drills.
 *
 * This module is intentionally free of React, DOM, and MIDI dependencies.
 * It only deals with pitch classes, note names, chord qualities, and parsing.
 */

export const SHARP_NAMES = [
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
];

export const FLAT_NAMES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

export type Root = {
  pc: number;
  name: string;
  flat: boolean;
};

export const ROOTS: Root[] = [
  { pc: 0, name: "C", flat: false },
  { pc: 1, name: "Db", flat: true },
  { pc: 2, name: "D", flat: false },
  { pc: 3, name: "Eb", flat: true },
  { pc: 4, name: "E", flat: false },
  { pc: 5, name: "F", flat: true },
  { pc: 6, name: "F#", flat: false },
  { pc: 7, name: "G", flat: false },
  { pc: 8, name: "Ab", flat: true },
  { pc: 9, name: "A", flat: false },
  { pc: 10, name: "Bb", flat: true },
  { pc: 11, name: "B", flat: false },
];

export type Quality = {
  suffix: string;
  tones: number[];
};

export type QualityGroup = {
  label: string;
  qualities: Quality[];
};

export const QUALITY_GROUPS: QualityGroup[] = [
  {
    label: "7th",
    qualities: [
      { suffix: "maj7", tones: [0, 4, 7, 11] },
      { suffix: "7", tones: [0, 4, 7, 10] },
      { suffix: "m7", tones: [0, 3, 7, 10] },
      { suffix: "m7b5", tones: [0, 3, 6, 10] },
      { suffix: "dim7", tones: [0, 3, 6, 9] },
    ],
  },
  {
    label: "9th",
    qualities: [
      { suffix: "9", tones: [0, 4, 7, 10, 14] },
      { suffix: "maj9", tones: [0, 4, 7, 11, 14] },
      { suffix: "m9", tones: [0, 3, 7, 10, 14] },
      { suffix: "m9(maj7)", tones: [0, 3, 7, 11, 14] },
      { suffix: "7b9", tones: [0, 4, 7, 10, 13] },
      { suffix: "7#9", tones: [0, 4, 7, 10, 15] },
      { suffix: "m7b5(9)", tones: [0, 3, 6, 10, 14] },
    ],
  },
  {
    label: "11th",
    qualities: [
      { suffix: "11", tones: [0, 4, 7, 10, 14, 17] },
      { suffix: "maj11", tones: [0, 4, 7, 11, 14, 17] },
      { suffix: "m11", tones: [0, 3, 7, 10, 14, 17] },
      { suffix: "7#11", tones: [0, 4, 7, 10, 14, 18] },
      { suffix: "maj7#11", tones: [0, 4, 7, 11, 14, 18] },
    ],
  },
  {
    label: "13th",
    qualities: [
      { suffix: "13", tones: [0, 4, 7, 10, 14, 17, 21] },
      { suffix: "maj13", tones: [0, 4, 7, 11, 14, 17, 21] },
      { suffix: "m13", tones: [0, 3, 7, 10, 14, 17, 21] },
      { suffix: "7b13", tones: [0, 4, 7, 10, 20] },
      { suffix: "13b9", tones: [0, 4, 7, 10, 13, 17, 21] },
      { suffix: "13#11", tones: [0, 4, 7, 10, 14, 18, 21] },
    ],
  },
];

export const FAMILY: Quality[] = QUALITY_GROUPS[0].qualities;

export const EXTENDED: Quality[] = QUALITY_GROUPS.slice(1).reduce<Quality[]>(
  (acc, group) => acc.concat(group.qualities),
  []
);

export const SINGLE_QUALITIES: Quality[] = QUALITY_GROUPS.reduce<Quality[]>(
  (acc, group) => acc.concat(group.qualities),
  []
);

export const REP_TARGETS = [1, 5, 8, 12, 16, 20];

/**
 * Wrap a pitch class to the 0–11 range.
 */
export function normalizePc(pc: number): number {
  return ((pc % 12) + 12) % 12;
}

/**
 * Get the note name for a pitch class.
 */
export function noteName(pc: number, useFlats = false): string {
  const n = normalizePc(pc);
  return useFlats ? FLAT_NAMES[n] : SHARP_NAMES[n];
}

/**
 * Map a root name (e.g. "C#", "Db", "F#") to its pitch class.
 */
const ROOT_NAME_TO_PC: Record<string, number> = {
  C: 0,
  "C#": 1,
  DB: 1,
  D: 2,
  "D#": 3,
  EB: 3,
  E: 4,
  F: 5,
  "F#": 6,
  GB: 6,
  G: 7,
  "G#": 8,
  AB: 8,
  A: 9,
  "A#": 10,
  BB: 10,
  B: 11,
};

/**
 * Parse a root name into a Root object.
 * Prefers flat spellings for enharmonic keys (Db over C#, etc.),
 * matching the ROOTS table, except F# which is preserved as-is.
 */
export function parseRoot(name: string): Root | null {
  const pc = ROOT_NAME_TO_PC[name.toUpperCase()];
  if (pc === undefined) return null;
  const root = ROOTS.find((r) => r.pc === pc);
  return root ?? null;
}

export type ParsedChord = {
  root: Root;
  quality: Quality;
  qualityIdx: number;
  suffix: string;
  fullSymbol: string;
};

const ROOT_TOKENS = [
  "C#",
  "Db",
  "D#",
  "Eb",
  "F#",
  "Gb",
  "G#",
  "Ab",
  "A#",
  "Bb",
  "C",
  "D",
  "E",
  "F",
  "G",
  "A",
  "B",
];

const ROOT_PATTERN = new RegExp(
  `(?<![A-Za-z#b♯♭0-9])(${ROOT_TOKENS.join("|")})`,
  "i"
);

/**
 * Parse just a root name from free text.
 *
 * Returns null if no recognizable root is found.
 */
export function parseRootFromText(text: string): Root | null {
  if (!text) return null;
  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const m = plain.match(ROOT_PATTERN);
  if (!m) return null;
  return parseRoot(m[1]);
}

/**
 * Parse a chord symbol from free text.
 *
 * Strips HTML tags, collapses whitespace, and looks for a root + quality suffix.
 * Returns null if no recognizable chord is found.
 */
export function parseChord(text: string): ParsedChord | null {
  if (!text) return null;

  const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const suffixes = SINGLE_QUALITIES.map((q) => q.suffix)
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  const suffixRe = suffixes.length ? `(${suffixes.join("|")})?` : "()?";

  const pattern = new RegExp(
    `(?<![A-Za-z#b♯♭0-9])(${ROOT_TOKENS.join("|")})\\s*${suffixRe}(?![A-Za-z#b♯♭0-9])`,
    "i"
  );

  const m = plain.match(pattern);
  if (!m) return null;

  const rootName = m[1];
  const suffix = m[2] ?? "";

  const root = parseRoot(rootName);
  if (!root) return null;

  const qualityIdx = SINGLE_QUALITIES.findIndex(
    (q) => q.suffix.toLowerCase() === suffix.toLowerCase()
  );

  if (qualityIdx === -1) return null;

  const quality = SINGLE_QUALITIES[qualityIdx];

  return {
    root,
    quality,
    qualityIdx,
    suffix,
    fullSymbol: `${root.name}${suffix}`,
  };
}

/**
 * Build a list of note names for a chord, using the root's preferred spelling.
 */
export function buildChord(root: Root, tones: number[]): string[] {
  return tones.map((iv) => noteName(root.pc + iv, root.flat));
}

/**
 * Build the pitch-class set for a chord voicing relative to a root.
 */
export function buildPitchClassSet(root: Root, tones: number[]): Set<number> {
  return new Set(tones.map((iv) => normalizePc(root.pc + iv)));
}

/**
 * Get the flat enharmonic equivalent of a sharp note name, if one exists.
 * e.g. "C#" -> "Db". Returns the input unchanged if no equivalent.
 */
export function enharmonicEquivalent(name: string): string {
  const pc = ROOT_NAME_TO_PC[name.toUpperCase()];
  if (pc === undefined) return name;
  return FLAT_NAMES[normalizePc(pc)];
}
