import { describe, expect, it } from "vitest";
import { midiNoteName, nameHeldNotes } from "@/lib/chord-naming";

describe("midiNoteName", () => {
  it("names middle C as C4", () => {
    expect(midiNoteName(60)).toBe("C4");
    expect(midiNoteName(69)).toBe("A4");
    expect(midiNoteName(61, true)).toBe("Db4");
  });
});

describe("nameHeldNotes", () => {
  it("returns null for nothing held", () => {
    expect(nameHeldNotes([])).toBeNull();
  });

  it("names a single note with its octave", () => {
    expect(nameHeldNotes([60])).toMatchObject({ symbol: "C4", kind: "note" });
    // Eb is spelled with a flat, as the ROOTS table prefers.
    expect(nameHeldNotes([63])?.symbol).toBe("Eb4");
  });

  it("names two pitch classes as an interval", () => {
    expect(nameHeldNotes([60, 64])).toMatchObject({
      symbol: "Major 3rd",
      kind: "interval",
    });
    expect(nameHeldNotes([60, 67])?.symbol).toBe("Perfect 5th");
    expect(nameHeldNotes([60, 72])?.symbol).toBe("C octaves");
  });

  it("names root-position triads and sevenths", () => {
    expect(nameHeldNotes([60, 64, 67])?.symbol).toBe("C");
    expect(nameHeldNotes([57, 60, 64])?.symbol).toBe("Am");
    expect(nameHeldNotes([60, 64, 67, 71])?.symbol).toBe("Cmaj7");
    expect(nameHeldNotes([62, 65, 69, 72])?.symbol).toBe("Dm7");
    expect(nameHeldNotes([67, 71, 74, 77])?.symbol).toBe("G7");
    expect(nameHeldNotes([59, 62, 65, 69])?.symbol).toBe("Bm7b5");
  });

  it("prefers the bass as root when two names fit the same notes", () => {
    expect(nameHeldNotes([60, 64, 67, 69])?.symbol).toBe("C6");
    expect(nameHeldNotes([57, 60, 64, 67])?.symbol).toBe("Am7");
  });

  it("names inversions with a slash bass", () => {
    expect(nameHeldNotes([64, 67, 72])?.symbol).toBe("C/E");
    expect(nameHeldNotes([55, 60, 64])?.symbol).toBe("C/G");
  });

  it("ignores doubled notes and order of arrival", () => {
    expect(nameHeldNotes([67, 60, 76, 64, 72])?.symbol).toBe("C");
  });

  it("spells flat keys with flats", () => {
    expect(nameHeldNotes([58, 62, 65])?.symbol).toBe("Bb");
    expect(nameHeldNotes([63, 67, 70, 74])?.symbol).toBe("Ebmaj7");
  });

  it("falls back to listing a cluster it cannot name", () => {
    expect(nameHeldNotes([60, 61, 62])).toMatchObject({
      symbol: "C C# D",
      kind: "cluster",
    });
  });
});
