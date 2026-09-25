import { describe, expect, it } from "vitest";
import {
  CHORD_WINDOW_MS,
  ROLL_DRILL_TARGETS,
  activePitchClasses,
  formatSeconds,
  isMiss,
  isTargetPlayed,
  missWords,
  summarize,
} from "@/lib/roll-drill";

const [cMajor, gMajor, aMinor, fMajor] = ROLL_DRILL_TARGETS;

describe("roll drill", () => {
  it("is I–V–vi–IV in C", () => {
    expect(ROLL_DRILL_TARGETS.map((t) => t.short)).toEqual(["C", "G", "Am", "F"]);
    for (const t of ROLL_DRILL_TARGETS) {
      expect(t.pcs).toHaveLength(t.spell.length);
      expect(t.hint.map((n) => n % 12)).toEqual(t.pcs);
    }
  });

  it("counts held notes and notes released inside the chord window", () => {
    const released = new Map([
      [64, 1000], // E, released 500ms ago: counts
      [67, 0], //    G, released 1500ms ago: gone
    ]);
    const pcs = activePitchClasses([60], released, 1500);
    expect([...pcs].sort()).toEqual([0, 4]);
    expect(activePitchClasses([], new Map([[62, 0]]), CHORD_WINDOW_MS).size).toBe(0);
  });

  it("accepts any octave and any order", () => {
    expect(isTargetPlayed(cMajor, new Set([7, 0, 4]))).toBe(true);
    expect(isTargetPlayed(aMinor, activePitchClasses([76, 45, 60], new Map(), 0))).toBe(true);
  });

  it("rejects a chord with a note missing or a note too many", () => {
    expect(isTargetPlayed(gMajor, new Set([7, 11]))).toBe(false);
    expect(isTargetPlayed(fMajor, new Set([5, 9, 0, 2]))).toBe(false);
  });

  it("calls a note outside the chord a miss", () => {
    expect(isMiss(cMajor, 61)).toBe(true);
    expect(isMiss(cMajor, 72)).toBe(false);
  });

  it("formats times and misses for people", () => {
    expect(formatSeconds(1840)).toBe("1.8 s");
    expect(missWords(0)).toBe("no misses");
    expect(missWords(1)).toBe("one miss");
    expect(missWords(3)).toBe("3 misses");
    expect(
      summarize([
        { name: "C", ms: 1000, misses: 1 },
        { name: "G", ms: 500, misses: 0 },
      ])
    ).toEqual({ totalMs: 1500, misses: 1 });
  });
});
