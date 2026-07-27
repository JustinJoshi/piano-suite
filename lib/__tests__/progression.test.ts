import { describe, it, expect } from "vitest";
import {
  buildIiVI,
  buildBlues12,
  buildProgression,
  chordSymbol,
  scaleName,
  updateProgressionHistory,
  normalizeProgressionSettings,
  DEFAULT_PROGRESSION_SETTINGS,
  historyKey,
  type ProgressionHistory,
} from "@/lib/progression";

describe("buildIiVI", () => {
  it("builds Dm7-G7-Cmaj7 in C", () => {
    const steps = buildIiVI(0);
    expect(steps.map(chordSymbol)).toEqual(["Dm7", "G7", "Cmaj7"]);
    expect(steps.map((s) => s.label)).toEqual(["ii", "V", "I"]);
  });

  it("builds Am7-D7-Gmaj7 in G", () => {
    const steps = buildIiVI(7);
    expect(steps.map(chordSymbol)).toEqual(["Am7", "D7", "Gmaj7"]);
  });

  it("normalizes out-of-range pitch classes", () => {
    const steps = buildIiVI(24); // two octaves above C
    expect(steps.map(chordSymbol)).toEqual(["Dm7", "G7", "Cmaj7"]);
  });
});

describe("buildBlues12", () => {
  it("builds 12 dom7 bars in C", () => {
    const steps = buildBlues12(0);
    expect(steps).toHaveLength(12);
    expect(steps.every((s) => s.quality.suffix === "7")).toBe(true);
  });

  it("follows the standard root sequence in C", () => {
    const steps = buildBlues12(0);
    expect(steps.map((s) => s.root.name)).toEqual([
      "C",
      "C",
      "C",
      "C",
      "F",
      "F",
      "C",
      "C",
      "G",
      "F",
      "C",
      "C",
    ]);
  });

  it("transposes to G", () => {
    const steps = buildBlues12(7);
    expect(steps.map((s) => s.root.name)).toEqual([
      "G",
      "G",
      "G",
      "G",
      "C",
      "C",
      "G",
      "G",
      "D",
      "C",
      "G",
      "G",
    ]);
  });
});

describe("buildProgression", () => {
  it("returns a labeled progression object", () => {
    const prog = buildProgression("ii-V-I", 0);
    expect(prog.type).toBe("ii-V-I");
    expect(prog.label).toBe("ii-V-I");
    expect(prog.steps).toHaveLength(3);
  });
});

describe("chordSymbol", () => {
  it("renders root + quality suffix", () => {
    const [step] = buildIiVI(0);
    expect(chordSymbol(step)).toBe("Dm7");
  });
});

describe("scaleName", () => {
  it("maps qualities to modes", () => {
    const steps = buildIiVI(0);
    expect(scaleName(steps[0].quality)).toBe("Dorian");
    expect(scaleName(steps[1].quality)).toBe("Mixolydian");
    expect(scaleName(steps[2].quality)).toBe("Ionian");
  });
});

describe("historyKey", () => {
  it("matches the original localStorage format", () => {
    expect(historyKey("ii-V-I", "C")).toBe("ii-V-I-C");
    expect(historyKey("blues12", "G")).toBe("blues12-G");
  });
});

describe("updateProgressionHistory", () => {
  it("creates a new entry on first loop", () => {
    const history: ProgressionHistory = {};
    const next = updateProgressionHistory(history, "ii-V-I", "C", [1000, 1200, 1500]);
    expect(next["ii-V-I-C"]).toEqual({
      bestStepMs: 1000,
      bestAvgMs: 1233,
      totalLoops: 1,
    });
  });

  it("keeps existing PBs when new loop is slower", () => {
    const history: ProgressionHistory = {
      "ii-V-I-C": { bestStepMs: 800, bestAvgMs: 1000, totalLoops: 1 },
    };
    const next = updateProgressionHistory(history, "ii-V-I", "C", [1000, 1200, 1500]);
    expect(next["ii-V-I-C"].bestStepMs).toBe(800);
    expect(next["ii-V-I-C"].bestAvgMs).toBe(1000);
    expect(next["ii-V-I-C"].totalLoops).toBe(2);
  });

  it("updates PBs when new loop is faster", () => {
    const history: ProgressionHistory = {
      "ii-V-I-C": { bestStepMs: 1000, bestAvgMs: 1200, totalLoops: 1 },
    };
    const next = updateProgressionHistory(history, "ii-V-I", "C", [600, 700, 800]);
    expect(next["ii-V-I-C"].bestStepMs).toBe(600);
    expect(next["ii-V-I-C"].bestAvgMs).toBe(700);
    expect(next["ii-V-I-C"].totalLoops).toBe(2);
  });

  it("does nothing with empty step times", () => {
    const history: ProgressionHistory = {};
    const next = updateProgressionHistory(history, "ii-V-I", "C", []);
    expect(next).toEqual(history);
  });
});

describe("normalizeProgressionSettings", () => {
  it("returns defaults for empty input", () => {
    expect(normalizeProgressionSettings({})).toEqual(
      DEFAULT_PROGRESSION_SETTINGS
    );
  });

  it("preserves valid settings", () => {
    const input = {
      progressionType: "blues12" as const,
      keyPc: 7,
      ankiFlip: true,
      stepChime: false,
      loopChime: false,
    };
    expect(normalizeProgressionSettings(input)).toEqual(input);
  });

  it("falls back to default type for invalid type", () => {
    expect(
      normalizeProgressionSettings({ progressionType: "invalid" as "ii-V-I" })
        .progressionType
    ).toBe(DEFAULT_PROGRESSION_SETTINGS.progressionType);
  });

  it("falls back to default key for invalid key pc", () => {
    expect(normalizeProgressionSettings({ keyPc: 99 }).keyPc).toBe(
      DEFAULT_PROGRESSION_SETTINGS.keyPc
    );
  });
});
