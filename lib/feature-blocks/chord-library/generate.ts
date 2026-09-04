/**
 * Pure chord-library generation. Turns chord symbols or roman numerals into
 * PracticeNote sequences, applying a voicing. Voicing is the reason this
 * component exists: rootless A and B are different inversions with identical
 * pitch-class sets, which the pitch-class scoring model cannot express.
 */

import {
  parseChord,
  parseRoot,
  normalizePc,
  buildPitchClassSet,
  noteName,
  type Root,
  type Quality,
} from "../../music-theory";
import { parseRomanNumerals, MAJOR_TRIAD } from "../../roman-numerals";
import type { PracticeNote } from "../../practice-note";
import type { ChordLibraryConfig, ChordVoicing } from "./config";

const BASS_OCTAVE_START = 48; // C3

// `parseChord` only recognizes qualities with a suffix, so a bare "C" or "G"
// fails there. A bare root means a major triad, so match it separately.
const BARE_ROOT_PATTERN =
  /^(C#|Db|D#|Eb|F#|Gb|G#|Ab|A#|Bb|C|D|E|F|G|A|B)$/i;

function parseChordLoose(
  token: string
): { root: Root; quality: Quality; fullSymbol: string } | null {
  const parsed = parseChord(token);
  if (parsed) return parsed;

  const bare = token.match(BARE_ROOT_PATTERN);
  if (!bare) return null;
  const root = parseRoot(bare[1]);
  if (!root) return null;
  return { root, quality: MAJOR_TRIAD, fullSymbol: root.name };
}

/** Natural 9th above the root; altered for the fully diminished qualities. */
function ninthFor(tones: number[]): number {
  return tones[1] === 3 && tones[2] === 6 ? 13 : 14;
}

/**
 * Voice one chord as MIDI notes. Rootless voicings only apply to four-note
 * (7th) chords — triads fall back to closed position.
 */
export function voiceChord(
  rootPc: number,
  tones: number[],
  voicing: ChordVoicing
): number[] {
  const root = BASS_OCTAVE_START + rootPc;

  if (voicing === "closed" || tones.length < 4) {
    return tones.map((t) => root + t);
  }

  // Jazz rootless voicings: A stacks 3-5-7-9, B stacks 7-9-3-5 (the same
  // notes re-ordered an octave apart — different inversion, same function).
  const third = tones[1];
  const fifth = tones[2];
  const seventh = tones[3];
  const ninth = ninthFor(tones);

  const intervals =
    voicing === "rootlessA"
      ? [third, fifth, seventh, ninth]
      : [seventh, ninth, third + 12, fifth + 12];

  return intervals.map((iv) => root + iv);
}

function noteFrom(
  rootPc: number,
  tones: number[],
  symbol: string,
  voicing: ChordVoicing,
  useFlats: boolean
): PracticeNote {
  const root: Root = { pc: rootPc, name: noteName(rootPc, useFlats), flat: useFlats };
  return {
    midi: voiceChord(rootPc, tones, voicing),
    pcs: buildPitchClassSet(root, tones),
    symbol,
    hand: undefined,
  };
}

/** Split free text on the separators a chord sheet uses. */
function tokens(text: string): string[] {
  return text
    .split(/[\s,|]+/)
    .map((t) => t.trim())
    .filter((t) => t !== "");
}

/**
 * Generate chords from a comma/space separated list of symbols, e.g.
 * "Cmaj7, Dm7, G7". Unparseable tokens are skipped.
 */
export function chordsFromSet(
  text: string,
  voicing: ChordVoicing,
  useFlats = false
): PracticeNote[] {
  const out: PracticeNote[] = [];
  for (const token of tokens(text)) {
    const parsed = parseChordLoose(token);
    if (!parsed) continue;
    out.push(
      noteFrom(
        parsed.root.pc,
        parsed.quality.tones,
        parsed.fullSymbol,
        voicing,
        useFlats
      )
    );
  }
  return out;
}

/**
 * Generate chords from a roman-numeral progression in one key, e.g.
 * "ii7 V7 Imaj7" in C. Invalid tokens are skipped.
 */
export function chordsFromRomanNumerals(
  text: string,
  keyRootName: string,
  voicing: ChordVoicing
): PracticeNote[] {
  const keyRoot = parseRoot(keyRootName);
  if (!keyRoot) return [];

  const { chords } = parseRomanNumerals(text);
  // F major has Bb in its signature even though "F" is spelled with no
  // accidental, so include it with the flat-spelled keys.
  const useFlats = keyRoot.flat || keyRoot.name === "F";
  return chords.map((chord) => {
    const rootPc = normalizePc(keyRoot.pc + chord.degreeSemitones);
    const symbol = `${noteName(rootPc, useFlats)}${chord.quality.suffix}`;
    return noteFrom(rootPc, chord.quality.tones, symbol, voicing, useFlats);
  });
}

/** Generate the configured chord stream, honoring the repeat count. */
export function generateChords(config: ChordLibraryConfig): PracticeNote[] {
  const once =
    config.mode === "set"
      ? chordsFromSet(config.chords, config.voicing)
      : chordsFromRomanNumerals(config.numerals, config.keyRoot, config.voicing);

  if (once.length === 0) return [];

  const out: PracticeNote[] = [];
  for (let i = 0; i < Math.max(1, config.loopCount); i++) {
    out.push(...once);
  }
  return out;
}
