import { describe, it, expect } from "vitest";
import {
  voiceChord,
  chordsFromSet,
  chordsFromRomanNumerals,
  generateChords,
} from "../generate";
import { chordLibraryDefaultConfig } from "../config";

// Cmaj7 tones: root, major third, fifth, major seventh.
const CMAJ7_TONES = [0, 4, 7, 11];
// Cm7 tones for a minor-seventh check.
const CM7_TONES = [0, 3, 7, 10];
// C major triad.
const C_TRIAD = [0, 4, 7];

describe("voiceChord", () => {
  it("stacks closed position from the root", () => {
    expect(voiceChord(0, C_TRIAD, "closed")).toEqual([48, 52, 55]);
  });

  it("gives rootless A and B different MIDI notes for the same chord", () => {
    const a = voiceChord(0, CMAJ7_TONES, "rootlessA");
    const b = voiceChord(0, CMAJ7_TONES, "rootlessB");
    expect(a).not.toEqual(b);
  });

  it("keeps the same pitch classes across rootless inversions", () => {
    const a = voiceChord(0, CMAJ7_TONES, "rootlessA");
    const b = voiceChord(0, CMAJ7_TONES, "rootlessB");
    const pcs = (notes: number[]) => new Set(notes.map((n) => n % 12));
    expect(pcs(a)).toEqual(pcs(b));
  });

  it("omits the root in rootless voicings", () => {
    const a = voiceChord(0, CMAJ7_TONES, "rootlessA");
    expect(a.every((n) => n % 12 !== 0)).toBe(true);
  });

  it("falls back to closed position for triads", () => {
    expect(voiceChord(0, C_TRIAD, "rootlessA")).toEqual([48, 52, 55]);
  });

  it("voices minor sevenths too", () => {
    const a = voiceChord(0, CM7_TONES, "rootlessA");
    // 3-5-7-9 of Cm7: Eb, G, Bb, D.
    expect(a).toEqual([48 + 3, 48 + 7, 48 + 10, 48 + 14]);
  });
});

describe("chordsFromSet", () => {
  it("parses a comma-separated list", () => {
    const chords = chordsFromSet("Cmaj7, Dm7, G7", "closed");
    expect(chords.map((c) => c.symbol)).toEqual(["Cmaj7", "Dm7", "G7"]);
    expect(chords.every((c) => c.midi.length === 4)).toBe(true);
  });

  it("skips unparseable tokens", () => {
    const chords = chordsFromSet("C, ???. G7", "closed");
    expect(chords.map((c) => c.symbol)).toEqual(["C", "G7"]);
  });
});

describe("chordsFromRomanNumerals", () => {
  it("builds the ii-V-I in C", () => {
    const chords = chordsFromRomanNumerals("ii7 V7 Imaj7", "C", "closed");
    expect(chords.map((c) => c.symbol)).toEqual(["Dm7", "G7", "Cmaj7"]);
  });

  it("transposes with the key", () => {
    const chords = chordsFromRomanNumerals("I IV V", "F", "closed");
    expect(chords.map((c) => c.symbol)).toEqual(["F", "Bb", "C"]);
  });

  it("returns nothing for an unknown key", () => {
    expect(chordsFromRomanNumerals("I", "?", "closed")).toEqual([]);
  });
});

describe("generateChords", () => {
  it("repeats the stream loopCount times", () => {
    const config = {
      ...chordLibraryDefaultConfig,
      chords: "C, F, G",
      loopCount: 3,
    };
    const chords = generateChords(config);
    expect(chords).toHaveLength(9);
  });

  it("returns an empty stream when nothing parses", () => {
    const config = { ...chordLibraryDefaultConfig, chords: "???" };
    expect(generateChords(config)).toEqual([]);
  });
});
