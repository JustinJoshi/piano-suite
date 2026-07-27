import { describe, it, expect } from "vitest";
import {
  pickRandomRoot,
  currentQuality,
  chordPromptSymbol,
  chordTargetPcs,
  arpeggioLhNames,
  arpeggioTargetPc,
  arpeggioFromLabel,
  qualityFromChordLabel,
  rootCyclingGroupKey,
  normalizeRootCyclingSettings,
  DEFAULT_ROOT_CYCLING_SETTINGS,
  CANONICAL_ARPEGGIO_RH_DEGREES,
  type RootCyclingSettings,
} from "@/lib/root-cycling";
import { ROOTS, SINGLE_QUALITIES } from "@/lib/music-theory";

describe("pickRandomRoot", () => {
  it("returns null for an empty pool", () => {
    expect(pickRandomRoot([], null)).toBeNull();
  });

  it("returns the only root when the pool has one item", () => {
    expect(pickRandomRoot([0], null)).toBe(0);
    expect(pickRandomRoot([0], 0)).toBe(0);
  });

  it("never returns the excluded root when there are alternatives", () => {
    const pool = [0, 4, 7];
    for (let i = 0; i < 50; i++) {
      const choice = pickRandomRoot(pool, 4);
      expect(choice).not.toBe(4);
      expect(pool).toContain(choice);
    }
  });

  it("filters out invalid pitch classes", () => {
    expect(pickRandomRoot([0, 4, 99], 4)).toBe(0);
  });
});

describe("currentQuality", () => {
  it("returns the quality at the configured index", () => {
    const settings: RootCyclingSettings = {
      ...DEFAULT_ROOT_CYCLING_SETTINGS,
      qualityIdx: 0,
    };
    expect(currentQuality(settings).suffix).toBe("maj7");
  });

  it("falls back to the first quality for an out-of-range index", () => {
    const settings: RootCyclingSettings = {
      ...DEFAULT_ROOT_CYCLING_SETTINGS,
      qualityIdx: 999,
    };
    expect(currentQuality(settings).suffix).toBe(SINGLE_QUALITIES[0].suffix);
  });
});

describe("chordPromptSymbol", () => {
  it("renders root + quality suffix", () => {
    const root = ROOTS.find((r) => r.pc === 0)!;
    expect(chordPromptSymbol(root, SINGLE_QUALITIES[2])).toBe("Cm7");
  });
});

describe("chordTargetPcs", () => {
  it("builds the correct pitch-class set for Cm7", () => {
    const root = ROOTS.find((r) => r.pc === 0)!;
    const pcs = chordTargetPcs(root, SINGLE_QUALITIES[2]);
    expect([...pcs].sort((a, b) => a - b)).toEqual([0, 3, 7, 10]);
  });
});

describe("arpeggioLhNames", () => {
  it("returns root + fifth using the root's preferred spelling", () => {
    const root = ROOTS.find((r) => r.pc === 1)!; // Db
    expect(arpeggioLhNames(root)).toEqual(["Db", "Ab"]);
  });
});

describe("arpeggioTargetPc", () => {
  it("returns the transposed pitch class for each degree", () => {
    const root = ROOTS.find((r) => r.pc === 0)!;
    expect(arpeggioTargetPc(root, 0)).toBe(2); // 9
    expect(arpeggioTargetPc(root, 1)).toBe(3); // b3
    expect(arpeggioTargetPc(root, 2)).toBe(5); // 11
  });

  it("wraps out-of-range indices to the root", () => {
    const root = ROOTS.find((r) => r.pc === 0)!;
    expect(arpeggioTargetPc(root, CANONICAL_ARPEGGIO_RH_DEGREES.length)).toBe(0);
  });
});

describe("arpeggioFromLabel", () => {
  it("returns Root for the first note after arming", () => {
    expect(arpeggioFromLabel(0, true)).toBe("Root");
  });

  it("returns the previous degree otherwise", () => {
    expect(arpeggioFromLabel(2, false)).toBe("b3");
    expect(arpeggioFromLabel(0, false)).toBe("11");
  });
});

describe("qualityFromChordLabel", () => {
  it("strips the root name from the label", () => {
    expect(qualityFromChordLabel("Dm7", "D")).toBe("m7");
  });

  it("returns the full label when the root is not a prefix", () => {
    expect(qualityFromChordLabel("m7", "D")).toBe("m7");
  });
});

describe("rootCyclingGroupKey", () => {
  it("builds chord-mode keys", () => {
    expect(rootCyclingGroupKey("chord", "m7")).toBe("Chord · m7");
  });

  it("builds arpeggio-mode keys", () => {
    expect(rootCyclingGroupKey("arpeggio", undefined, "Root", "9")).toBe(
      "Arpeggio · Root→9"
    );
  });
});

describe("normalizeRootCyclingSettings", () => {
  it("returns defaults for empty input", () => {
    expect(normalizeRootCyclingSettings({})).toEqual(
      DEFAULT_ROOT_CYCLING_SETTINGS
    );
  });

  it("preserves valid settings", () => {
    const input: RootCyclingSettings = {
      mode: "arpeggio",
      qualityIdx: 1,
      includedPcs: [0, 2, 4],
    };
    expect(normalizeRootCyclingSettings(input)).toEqual(input);
  });

  it("falls back for invalid mode", () => {
    const result = normalizeRootCyclingSettings({ mode: "invalid" as "chord" });
    expect(result.mode).toBe(DEFAULT_ROOT_CYCLING_SETTINGS.mode);
  });

  it("falls back for invalid quality index", () => {
    const result = normalizeRootCyclingSettings({ qualityIdx: -5 });
    expect(result.qualityIdx).toBe(DEFAULT_ROOT_CYCLING_SETTINGS.qualityIdx);
  });

  it("falls back to all roots for an empty included pool", () => {
    const result = normalizeRootCyclingSettings({ includedPcs: [] });
    expect(result.includedPcs).toEqual(DEFAULT_ROOT_CYCLING_SETTINGS.includedPcs);
  });
});
