import { describe, it, expect } from "vitest";
import {
  normalizePc,
  noteName,
  parseRoot,
  parseChord,
  buildChord,
  buildPitchClassSet,
  enharmonicEquivalent,
  ROOTS,
  SINGLE_QUALITIES,
} from "@/lib/music-theory";

describe("normalizePc", () => {
  it("wraps positive values to 0-11", () => {
    expect(normalizePc(12)).toBe(0);
    expect(normalizePc(13)).toBe(1);
    expect(normalizePc(25)).toBe(1);
  });

  it("wraps negative values to 0-11", () => {
    expect(normalizePc(-1)).toBe(11);
    expect(normalizePc(-12)).toBe(0);
    expect(normalizePc(-13)).toBe(11);
  });

  it("leaves 0-11 unchanged", () => {
    for (let i = 0; i < 12; i++) {
      expect(normalizePc(i)).toBe(i);
    }
  });
});

describe("noteName", () => {
  it("returns sharp names by default", () => {
    expect(noteName(0)).toBe("C");
    expect(noteName(1)).toBe("C#");
    expect(noteName(3)).toBe("D#");
    expect(noteName(6)).toBe("F#");
  });

  it("returns flat names when requested", () => {
    expect(noteName(1, true)).toBe("Db");
    expect(noteName(3, true)).toBe("Eb");
    expect(noteName(6, true)).toBe("Gb");
  });

  it("wraps out-of-range pitch classes", () => {
    expect(noteName(13)).toBe("C#");
    expect(noteName(-1)).toBe("B");
  });
});

describe("parseRoot", () => {
  it("parses natural roots", () => {
    expect(parseRoot("C")?.pc).toBe(0);
    expect(parseRoot("D")?.pc).toBe(2);
    expect(parseRoot("F")?.pc).toBe(5);
  });

  it("parses sharp and flat roots", () => {
    expect(parseRoot("C#")?.pc).toBe(1);
    expect(parseRoot("Db")?.pc).toBe(1);
    expect(parseRoot("F#")?.pc).toBe(6);
    expect(parseRoot("Gb")?.pc).toBe(6);
  });

  it("is case-insensitive", () => {
    expect(parseRoot("c#")?.pc).toBe(1);
    expect(parseRoot("BB")?.pc).toBe(10);
  });

  it("prefers flat spellings for enharmonic keys", () => {
    expect(parseRoot("C#")?.name).toBe("Db");
    expect(parseRoot("D#")?.name).toBe("Eb");
    expect(parseRoot("F#")?.name).toBe("F#");
  });

  it("returns null for invalid roots", () => {
    expect(parseRoot("H")).toBeNull();
    expect(parseRoot("C##")).toBeNull();
  });
});

describe("parseChord", () => {
  it("parses simple chords", () => {
    const chord = parseChord("Gm7");
    expect(chord).not.toBeNull();
    expect(chord?.root.pc).toBe(7);
    expect(chord?.suffix).toBe("m7");
    expect(chord?.fullSymbol).toBe("Gm7");
  });

  it("parses extended chords", () => {
    const chord = parseChord("F#m9(maj7)");
    expect(chord).not.toBeNull();
    expect(chord?.root.pc).toBe(6);
    expect(chord?.suffix).toBe("m9(maj7)");
  });

  it("strips HTML tags from input", () => {
    const chord = parseChord("<b>C</b>maj7");
    expect(chord).not.toBeNull();
    expect(chord?.root.pc).toBe(0);
    expect(chord?.suffix).toBe("maj7");
  });

  it("is case-insensitive", () => {
    const chord = parseChord("bbmaj7");
    expect(chord).not.toBeNull();
    expect(chord?.root.pc).toBe(10);
    expect(chord?.suffix).toBe("maj7");
  });

  it("handles whitespace between root and suffix", () => {
    const chord = parseChord("G m7");
    expect(chord).not.toBeNull();
    expect(chord?.root.pc).toBe(7);
    expect(chord?.suffix).toBe("m7");
  });

  it("avoids matching inside larger tokens", () => {
    expect(parseChord("CMaj7foo")).toBeNull();
    expect(parseChord("fooGm7bar")).toBeNull();
  });

  it("returns null for unrecognized symbols", () => {
    expect(parseChord("Hello world")).toBeNull();
    expect(parseChord("")).toBeNull();
  });

  it("matches longest suffix first", () => {
    const chord = parseChord("Cmaj7#11");
    expect(chord).not.toBeNull();
    expect(chord?.suffix).toBe("maj7#11");
  });

  it("matches every supported quality", () => {
    for (const quality of SINGLE_QUALITIES) {
      const chord = parseChord(`C${quality.suffix}`);
      expect(chord, `failed for ${quality.suffix}`).not.toBeNull();
      expect(chord?.quality.suffix).toBe(quality.suffix);
    }
  });
});

describe("buildChord", () => {
  it("builds a C major 7 chord", () => {
    const root = ROOTS[0];
    const quality = SINGLE_QUALITIES.find((q) => q.suffix === "maj7")!;
    expect(buildChord(root, quality.tones)).toEqual(["C", "E", "G", "B"]);
  });

  it("builds a Db major 7 chord with flat names", () => {
    const root = ROOTS[1];
    const quality = SINGLE_QUALITIES.find((q) => q.suffix === "maj7")!;
    expect(buildChord(root, quality.tones)).toEqual(["Db", "F", "Ab", "C"]);
  });

  it("builds an extended chord", () => {
    const root = ROOTS[0];
    const quality = SINGLE_QUALITIES.find((q) => q.suffix === "13")!;
    expect(buildChord(root, quality.tones)).toEqual([
      "C",
      "E",
      "G",
      "A#",
      "D",
      "F",
      "A",
    ]);
  });
});

describe("buildPitchClassSet", () => {
  it("builds the correct pitch class set for a Cmaj7", () => {
    const root = ROOTS[0];
    const quality = SINGLE_QUALITIES.find((q) => q.suffix === "maj7")!;
    const pcs = buildPitchClassSet(root, quality.tones);
    expect(pcs).toEqual(new Set([0, 4, 7, 11]));
  });

  it("wraps pitch classes to 0-11", () => {
    const root = ROOTS[11]; // B
    const quality = SINGLE_QUALITIES.find((q) => q.suffix === "maj7")!;
    const pcs = buildPitchClassSet(root, quality.tones);
    expect(pcs).toEqual(new Set([11, 3, 6, 10]));
  });
});

describe("enharmonicEquivalent", () => {
  it("returns flat equivalents for sharps", () => {
    expect(enharmonicEquivalent("C#")).toBe("Db");
    expect(enharmonicEquivalent("D#")).toBe("Eb");
    expect(enharmonicEquivalent("G#")).toBe("Ab");
  });

  it("returns the same flat name for flats", () => {
    expect(enharmonicEquivalent("Db")).toBe("Db");
    expect(enharmonicEquivalent("Eb")).toBe("Eb");
  });

  it("returns naturals unchanged", () => {
    expect(enharmonicEquivalent("C")).toBe("C");
    expect(enharmonicEquivalent("F")).toBe("F");
  });
});
