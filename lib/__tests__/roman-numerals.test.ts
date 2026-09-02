import { describe, it, expect } from "vitest";
import {
  parseRomanNumeral,
  parseRomanNumerals,
  MAJOR_TRIAD,
  MINOR_TRIAD,
  DIM_TRIAD,
  AUG_TRIAD,
  MAJ7,
  DOM7,
  MIN7,
  HALF_DIM7,
  DIM7,
} from "@/lib/roman-numerals";

describe("parseRomanNumeral", () => {
  it("reads case as chord quality", () => {
    expect(parseRomanNumeral("I")?.quality).toEqual(MAJOR_TRIAD);
    expect(parseRomanNumeral("vi")?.quality).toEqual(MINOR_TRIAD);
  });

  it("places degrees at major-scale intervals", () => {
    expect(parseRomanNumeral("I")?.degreeSemitones).toBe(0);
    expect(parseRomanNumeral("ii")?.degreeSemitones).toBe(2);
    expect(parseRomanNumeral("IV")?.degreeSemitones).toBe(5);
    expect(parseRomanNumeral("V")?.degreeSemitones).toBe(7);
    expect(parseRomanNumeral("vi")?.degreeSemitones).toBe(9);
    expect(parseRomanNumeral("vii")?.degreeSemitones).toBe(11);
  });

  it("applies flat and sharp accidentals", () => {
    expect(parseRomanNumeral("bVII")?.degreeSemitones).toBe(10);
    expect(parseRomanNumeral("bIII")?.degreeSemitones).toBe(3);
    expect(parseRomanNumeral("#IV")?.degreeSemitones).toBe(6);
  });

  it("distinguishes M7 from m7", () => {
    expect(parseRomanNumeral("IM7")?.quality).toEqual(MAJ7);
    expect(parseRomanNumeral("iim7")?.quality).toEqual(MIN7);
  });

  it("reads sevenths by numeral case", () => {
    expect(parseRomanNumeral("V7")?.quality).toEqual(DOM7);
    expect(parseRomanNumeral("ii7")?.quality).toEqual(MIN7);
    expect(parseRomanNumeral("Imaj7")?.quality).toEqual(MAJ7);
  });

  it("handles diminished, half-diminished, and augmented", () => {
    expect(parseRomanNumeral("vii°")?.quality).toEqual(DIM_TRIAD);
    expect(parseRomanNumeral("vii°7")?.quality).toEqual(DIM7);
    expect(parseRomanNumeral("viiø7")?.quality).toEqual(HALF_DIM7);
    expect(parseRomanNumeral("viim7b5")?.quality).toEqual(HALF_DIM7);
    expect(parseRomanNumeral("III+")?.quality).toEqual(AUG_TRIAD);
    expect(parseRomanNumeral("IIIaug")?.quality).toEqual(AUG_TRIAD);
  });

  it("keeps the raw token as the label", () => {
    expect(parseRomanNumeral(" ii7 ")?.label).toBe("ii7");
  });

  it("rejects nonsense rather than guessing", () => {
    expect(parseRomanNumeral("")).toBeNull();
    expect(parseRomanNumeral("H")).toBeNull();
    expect(parseRomanNumeral("VIII")).toBeNull();
    expect(parseRomanNumeral("V?")).toBeNull();
    // Mixed case is a typo, not a chord.
    expect(parseRomanNumeral("Iv")).toBeNull();
  });
});

describe("parseRomanNumerals", () => {
  it("splits on spaces, commas, pipes, and dashes", () => {
    expect(parseRomanNumerals("I V vi IV").chords).toHaveLength(4);
    expect(parseRomanNumerals("I, V, vi, IV").chords).toHaveLength(4);
    expect(parseRomanNumerals("I - V - vi - IV").chords).toHaveLength(4);
    expect(parseRomanNumerals("I | V | vi | IV").chords).toHaveLength(4);
  });

  it("reports the tokens it could not parse instead of dropping them silently", () => {
    const result = parseRomanNumerals("I V xx IV");
    expect(result.chords).toHaveLength(3);
    expect(result.invalidTokens).toEqual(["xx"]);
  });

  it("returns empty for empty input", () => {
    expect(parseRomanNumerals("   ")).toEqual({
      chords: [],
      invalidTokens: [],
    });
  });

  it("parses the ii-V-I preset shape", () => {
    const { chords } = parseRomanNumerals("ii7 V7 Imaj7");
    expect(chords.map((c) => c.degreeSemitones)).toEqual([2, 7, 0]);
    expect(chords.map((c) => c.quality)).toEqual([MIN7, DOM7, MAJ7]);
  });
});
