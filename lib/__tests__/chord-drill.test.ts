import { describe, it, expect } from "vitest";
import {
  gradeForTime,
  effectiveRepTarget,
  updateHistory,
  normalizeSettings,
  clampRepOverride,
  DEFAULT_CHORD_DRILL_SETTINGS,
  CHORD_DRILL_SETTINGS_KEY,
  CHORD_DRILL_HISTORY_KEY,
} from "@/lib/chord-drill";

describe("gradeForTime", () => {
  it("returns Good under the good threshold", () => {
    expect(gradeForTime(1500, { good: 2000, hard: 4000 })).toEqual({
      ease: 3,
      label: "Good",
    });
  });

  it("returns Hard between thresholds", () => {
    expect(gradeForTime(2500, { good: 2000, hard: 4000 })).toEqual({
      ease: 2,
      label: "Hard",
    });
  });

  it("returns Again above the hard threshold", () => {
    expect(gradeForTime(5000, { good: 2000, hard: 4000 })).toEqual({
      ease: 1,
      label: "Again",
    });
  });
});

describe("effectiveRepTarget", () => {
  const base = {
    chordKey: "Cmaj7",
    baseTarget: 12,
    perChordRepsEnabled: false,
    perChordReps: {},
    newCardRepBoost: false,
    newCardRepTarget: 20,
    currentCardQueue: null as const,
  };

  it("falls back to the base target", () => {
    expect(effectiveRepTarget(base)).toBe(12);
  });

  it("applies per-chord overrides when enabled", () => {
    expect(
      effectiveRepTarget({
        ...base,
        perChordRepsEnabled: true,
        perChordReps: { Cmaj7: 24 },
      })
    ).toBe(24);
  });

  it("falls back from per-chord override to new-card boost", () => {
    expect(
      effectiveRepTarget({
        ...base,
        perChordRepsEnabled: true,
        perChordReps: { Dm7: 24 },
        newCardRepBoost: true,
        currentCardQueue: "new",
      })
    ).toBe(20);
  });

  it("applies new-card boost when enabled", () => {
    expect(
      effectiveRepTarget({
        ...base,
        newCardRepBoost: true,
        currentCardQueue: "new",
      })
    ).toBe(20);
  });
});

describe("updateHistory", () => {
  it("creates initial history for a new chord", () => {
    const result = updateHistory({}, "Cmaj7", [1500, 1200, 1100]);
    expect(result["Cmaj7"]).toEqual({
      bestAvgMs: 1267,
      bestSingleMs: 1100,
      bestFirstPressMs: 1500,
      totalReps: 3,
    });
  });

  it("updates only when new stats are better", () => {
    const initial = {
      Cmaj7: {
        bestAvgMs: 1000,
        bestSingleMs: 900,
        bestFirstPressMs: 950,
        totalReps: 4,
      },
    };
    const result = updateHistory(initial, "Cmaj7", [1200, 1100]);
    expect(result["Cmaj7"]).toEqual({
      bestAvgMs: 1000,
      bestSingleMs: 900,
      bestFirstPressMs: 950,
      totalReps: 6,
    });
  });
});

describe("normalizeSettings", () => {
  it("returns defaults for empty input", () => {
    expect(normalizeSettings({})).toEqual(DEFAULT_CHORD_DRILL_SETTINGS);
  });

  it("clamps invalid numeric values", () => {
    const result = normalizeSettings({
      repTarget: -5,
      countdownSeconds: 100,
      breakSeconds: -1,
      newCardRepTarget: 0,
    });
    expect(result.repTarget).toBe(1);
    expect(result.countdownSeconds).toBe(30);
    expect(result.breakSeconds).toBe(0);
    expect(result.newCardRepTarget).toBe(1);
  });

  it("keeps good below hard", () => {
    const result = normalizeSettings({
      gradeThresholds: { good: 5000, hard: 4000 },
    });
    expect(result.gradeThresholds.good).toBe(5000);
    expect(result.gradeThresholds.hard).toBe(5100);
  });

  it("preserves valid overrides", () => {
    const result = normalizeSettings({
      mode: "family",
      repTarget: 8,
      showNotes: true,
      perChordReps: { Cmaj7: 20 },
    });
    expect(result.mode).toBe("family");
    expect(result.repTarget).toBe(8);
    expect(result.showNotes).toBe(true);
    expect(result.perChordReps).toEqual({ Cmaj7: 20 });
  });
});

describe("clampRepOverride", () => {
  it("clamps to 1–999", () => {
    expect(clampRepOverride(0)).toBe(1);
    expect(clampRepOverride(1000)).toBe(999);
    expect(clampRepOverride(42.7)).toBe(43);
  });
});

describe("settings keys", () => {
  it("exports stable settings keys", () => {
    expect(CHORD_DRILL_SETTINGS_KEY).toBe("chord-drill-settings-v1");
    expect(CHORD_DRILL_HISTORY_KEY).toBe("chord-drill-history-v1");
  });
});
