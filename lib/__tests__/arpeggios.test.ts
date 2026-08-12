import { describe, it, expect } from "vitest";
import {
  ARPEGGIO_CHORDS,
  DEFAULT_ORDER,
  findArpeggioByRootPc,
  normalizeArpeggioSettings,
  ARPEGGIO_SETTINGS_KEY,
  DEFAULT_ARPEGGIO_SETTINGS,
  autoFilteredPcs,
} from "@/lib/arpeggios";
import {
  activeSequence,
  currentChord,
  currentFromLabel,
  gradeForMisses,
  noteNameForPc,
} from "@/lib/sequence-drill";

describe("ARPEGGIO_CHORDS", () => {
  it("contains 12 minor-11th cells", () => {
    expect(ARPEGGIO_CHORDS).toHaveLength(12);
  });

  it("has the expected default order", () => {
    expect(DEFAULT_ORDER).toEqual([
      "Bbm11",
      "Fm11",
      "Abm11",
      "Ebm11",
      "F#m11",
      "C#m11",
      "Em11",
      "Bm11",
      "Dm11",
      "Am11",
      "Cm11",
      "Gm11",
    ]);
  });

  it("every cell has a non-empty LH pedal and a 7-note RH sequence", () => {
    for (const chord of ARPEGGIO_CHORDS) {
      expect(chord.lh.length).toBeGreaterThan(0);
      expect(chord.rh).toHaveLength(7);
      for (const note of chord.rh) {
        expect(note.deg).toBeDefined();
      }
    }
  });
});

describe("findArpeggioByRootPc", () => {
  it("finds Bbm11 by Bb root (pc 10)", () => {
    expect(findArpeggioByRootPc(10)?.id).toBe("Bbm11");
  });

  it("finds Gm11 by G root (pc 7)", () => {
    expect(findArpeggioByRootPc(7)?.id).toBe("Gm11");
  });

  it("returns null for an unmatched pc", () => {
    expect(findArpeggioByRootPc(99)).toBeNull();
  });
});

describe("sequence helpers", () => {
  const config = {
    order: DEFAULT_ORDER.slice(),
    excluded: ["Fm11", "Cm11"],
  };

  it("activeSequence filters excluded ids", () => {
    const active = activeSequence(config);
    expect(active).not.toContain("Fm11");
    expect(active).not.toContain("Cm11");
    expect(active).toHaveLength(10);
  });

  it("currentChord wraps around and respects excluded ids", () => {
    const chord = currentChord(ARPEGGIO_CHORDS, config, 0);
    expect(chord?.id).toBe("Bbm11");
    expect(currentChord(ARPEGGIO_CHORDS, config, 1)?.id).toBe("Abm11");
  });

  it("currentFromLabel returns Root for the first note", () => {
    const chord = ARPEGGIO_CHORDS[0];
    expect(currentFromLabel(chord, 0, true)).toBe("Root");
  });

  it("currentFromLabel returns the previous degree after the first note", () => {
    const chord = ARPEGGIO_CHORDS[0];
    expect(currentFromLabel(chord, 1, false)).toBe("9");
    expect(currentFromLabel(chord, 0, false)).toBe("11");
  });

  it("noteNameForPc returns sharp-spelled names", () => {
    expect(noteNameForPc(0)).toBe("C");
    expect(noteNameForPc(1)).toBe("C#");
    expect(noteNameForPc(10)).toBe("A#");
  });
});

describe("gradeForMisses", () => {
  const thresholds = { good: 0, hard: 2 };

  it("returns Good for 0 misses", () => {
    expect(gradeForMisses(0, thresholds)).toEqual({ ease: 3, label: "Good" });
  });

  it("returns Hard for 1–2 misses", () => {
    expect(gradeForMisses(1, thresholds)).toEqual({ ease: 2, label: "Hard" });
    expect(gradeForMisses(2, thresholds)).toEqual({ ease: 2, label: "Hard" });
  });

  it("returns Again for 3+ misses", () => {
    expect(gradeForMisses(3, thresholds)).toEqual({ ease: 1, label: "Again" });
  });
});

describe("normalizeArpeggioSettings", () => {
  it("applies defaults for empty input", () => {
    const settings = normalizeArpeggioSettings({});
    expect(settings.flashOnMiss).toBe(true);
    expect(settings.showLh).toBe(true);
    expect(settings.lapChime).toBe(false);
    expect(settings.config.order).toEqual(DEFAULT_ORDER);
    expect(settings.config.excluded).toEqual([]);
    expect(settings.countdownSeconds).toBe(3);
    expect(settings.breakSeconds).toBe(0);
    expect(settings.breakTickSound).toBe(true);
    expect(settings.missThresholds).toEqual({ good: 0, hard: 2 });
    expect(settings.ignoredPcs).toEqual([]);
  });

  it("preserves valid overrides", () => {
    const settings = normalizeArpeggioSettings({
      flashOnMiss: false,
      countdownSeconds: 5,
      missThresholds: { good: 1, hard: 3 },
      config: { order: DEFAULT_ORDER.slice().reverse(), excluded: ["Bbm11"] },
    });
    expect(settings.flashOnMiss).toBe(false);
    expect(settings.countdownSeconds).toBe(5);
    expect(settings.missThresholds).toEqual({ good: 1, hard: 3 });
    expect(settings.config.order[0]).toBe("Gm11");
    expect(settings.config.excluded).toEqual(["Bbm11"]);
  });

  it("clamps invalid thresholds so good <= hard", () => {
    const settings = normalizeArpeggioSettings({
      missThresholds: { good: 5, hard: 2 },
    });
    expect(settings.missThresholds.good).toBe(5);
    expect(settings.missThresholds.hard).toBe(5);
  });

  it("filters unknown excluded ids", () => {
    const settings = normalizeArpeggioSettings({
      config: { order: DEFAULT_ORDER.slice(), excluded: ["Bbm11", "Xyz"] },
    });
    expect(settings.config.excluded).toEqual(["Bbm11"]);
  });

  it("preserves valid ignored pitch classes", () => {
    const settings = normalizeArpeggioSettings({
      ignoredPcs: [0, 3, 7, 7, 11],
    });
    expect(settings.ignoredPcs).toEqual([0, 3, 7, 11]);
  });

  it("filters invalid ignored pitch classes", () => {
    const settings = normalizeArpeggioSettings({
      ignoredPcs: [-1, 0, 5, 12, 3.5, "x", null] as unknown as number[],
    });
    expect(settings.ignoredPcs).toEqual([0, 5]);
  });

  it("defaults autoFilter to true", () => {
    const settings = normalizeArpeggioSettings({});
    expect(settings.autoFilter).toBe(true);
  });

  it("preserves autoFilter override", () => {
    const settings = normalizeArpeggioSettings({ autoFilter: false });
    expect(settings.autoFilter).toBe(false);
  });

  it("autoFilteredPcs returns LH pedal and RH sequence PCs for a chord", () => {
    const chord = ARPEGGIO_CHORDS[0]!; // Bbm11
    expect(autoFilteredPcs(chord)).toEqual([0, 1, 3, 5, 8, 10]);
  });

  it("autoFilteredPcs returns an empty array for a null chord", () => {
    expect(autoFilteredPcs(null)).toEqual([]);
  });

  it("resets order to default if it does not contain all ids", () => {
    const settings = normalizeArpeggioSettings({
      config: { order: ["Bbm11", "Fm11"], excluded: [] },
    });
    expect(settings.config.order).toEqual(DEFAULT_ORDER);
  });
});

describe("ARPEGGIO_SETTINGS_KEY", () => {
  it("has a stable settings key", () => {
    expect(ARPEGGIO_SETTINGS_KEY).toBe("arpeggio-settings-v1");
  });

  it("default settings match the key expectations", () => {
    expect(DEFAULT_ARPEGGIO_SETTINGS).toBeDefined();
  });
});
