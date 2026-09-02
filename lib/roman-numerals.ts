/**
 * Roman-numeral progression parsing.
 *
 * Lets a user type `I V vi IV` or `ii7 V7 Imaj7` and get back playable chord
 * targets in any key. Triads live here rather than in `lib/music-theory.ts`
 * because that module's `QUALITY_GROUPS` deliberately starts at 7th chords —
 * pop progressions need plain triads.
 *
 * Free of React, DOM, MIDI, and Convex dependencies.
 */

import { type Quality, normalizePc } from "./music-theory";

export const MAJOR_TRIAD: Quality = { suffix: "", tones: [0, 4, 7] };
export const MINOR_TRIAD: Quality = { suffix: "m", tones: [0, 3, 7] };
export const DIM_TRIAD: Quality = { suffix: "dim", tones: [0, 3, 6] };
export const AUG_TRIAD: Quality = { suffix: "aug", tones: [0, 4, 8] };

export const MAJ7: Quality = { suffix: "maj7", tones: [0, 4, 7, 11] };
export const DOM7: Quality = { suffix: "7", tones: [0, 4, 7, 10] };
export const MIN7: Quality = { suffix: "m7", tones: [0, 3, 7, 10] };
export const HALF_DIM7: Quality = { suffix: "m7b5", tones: [0, 3, 6, 10] };
export const DIM7: Quality = { suffix: "dim7", tones: [0, 3, 6, 9] };

/** Semitones above the tonic for scale degrees 1–7 of a major scale. */
const MAJOR_DEGREE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

const NUMERAL_VALUES: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
};

const TOKEN_PATTERN = /^([b#]?)([IViv]+)(.*)$/;

export type RomanChord = {
  /** The token exactly as the user typed it, used as the step label. */
  label: string;
  /** Semitones above the key's tonic. */
  degreeSemitones: number;
  quality: Quality;
};

function resolveQuality(modifier: string, isUpperCase: boolean): Quality | null {
  const raw = modifier.trim();
  const lower = raw.toLowerCase();

  if (raw === "") return isUpperCase ? MAJOR_TRIAD : MINOR_TRIAD;

  // `M7` is a major seventh and `m7` is a minor seventh, so this comparison
  // has to stay case-sensitive — lower-casing first would merge them.
  if (raw === "M7") return MAJ7;
  if (lower === "maj7") return MAJ7;

  if (lower.startsWith("ø")) return HALF_DIM7;

  const isDiminished =
    lower.startsWith("°") ||
    lower.startsWith("o") ||
    lower.startsWith("dim");
  if (isDiminished) return lower.endsWith("7") ? DIM7 : DIM_TRIAD;

  if (lower.startsWith("+") || lower.startsWith("aug")) return AUG_TRIAD;

  if (lower === "7") return isUpperCase ? DOM7 : MIN7;
  if (lower === "m") return MINOR_TRIAD;
  if (lower === "m7") return MIN7;
  if (lower === "m7b5") return HALF_DIM7;

  return null;
}

/**
 * Parse one roman-numeral token. Returns null for anything unrecognised so
 * callers can report the bad token instead of silently dropping it.
 */
export function parseRomanNumeral(token: string): RomanChord | null {
  const trimmed = token.trim();
  if (trimmed === "") return null;

  const match = TOKEN_PATTERN.exec(trimmed);
  if (!match) return null;

  const [, accidental, numeral, modifier] = match;
  const value = NUMERAL_VALUES[numeral.toUpperCase()];
  if (value === undefined) return null;

  // A numeral is "major" when every letter is upper case; mixed case (e.g.
  // "Iv") is a typo rather than a chord, so reject it.
  const isUpperCase = numeral === numeral.toUpperCase();
  const isLowerCase = numeral === numeral.toLowerCase();
  if (!isUpperCase && !isLowerCase) return null;

  const quality = resolveQuality(modifier, isUpperCase);
  if (!quality) return null;

  const shift = accidental === "b" ? -1 : accidental === "#" ? 1 : 0;

  return {
    label: trimmed,
    degreeSemitones: normalizePc(MAJOR_DEGREE_SEMITONES[value - 1] + shift),
    quality,
  };
}

export type RomanProgression = {
  chords: RomanChord[];
  /** Tokens that could not be parsed, so the editor can show what to fix. */
  invalidTokens: string[];
};

/**
 * Parse a whitespace-, comma-, pipe-, or dash-separated progression, e.g.
 * `"I - V - vi - IV"`.
 */
export function parseRomanNumerals(text: string): RomanProgression {
  const tokens = text
    .split(/[\s,|-]+/)
    .map((t) => t.trim())
    .filter((t) => t !== "");

  const chords: RomanChord[] = [];
  const invalidTokens: string[] = [];

  for (const token of tokens) {
    const chord = parseRomanNumeral(token);
    if (chord) {
      chords.push(chord);
    } else {
      invalidTokens.push(token);
    }
  }

  return { chords, invalidTokens };
}
