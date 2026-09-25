import { beforeEach, describe, expect, it } from "vitest";
import {
  ROLL_LEDGER_KEY,
  clearRuns,
  loadRuns,
  parseRuns,
  runTotal,
  saveRun,
  streakDays,
} from "@/lib/roll-ledger";

const run = (at: number, ms = 1000) => ({ at, results: [{ name: "C", ms, misses: 0 }] });

describe("roll ledger", () => {
  beforeEach(() => localStorage.clear());

  it("saves, loads and clears runs under its own key", () => {
    expect(loadRuns()).toEqual([]);
    expect(saveRun(run(1))).toBe(true);
    expect(saveRun(run(2))).toBe(true);
    expect(loadRuns()?.map((r) => r.at)).toEqual([1, 2]);
    expect(localStorage.getItem(ROLL_LEDGER_KEY)).not.toBeNull();
    clearRuns();
    expect(loadRuns()).toEqual([]);
  });

  it("drops malformed entries instead of failing", () => {
    expect(parseRuns("not json")).toEqual([]);
    expect(parseRuns(JSON.stringify([run(1), { at: "x" }, null]))).toHaveLength(1);
  });

  it("reports blocked storage as null", () => {
    expect(loadRuns(null)).toBeNull();
    expect(saveRun(run(1), null)).toBe(false);
  });

  it("counts consecutive days ending today or yesterday", () => {
    const now = new Date(2026, 8, 25, 12);
    const day = (offset: number) => new Date(2026, 8, 25 + offset, 9).getTime();
    expect(streakDays([], now)).toBe(0);
    expect(streakDays([run(day(0))], now)).toBe(1);
    expect(streakDays([run(day(0)), run(day(-1)), run(day(-2))], now)).toBe(3);
    // Nothing today yet: yesterday's streak still stands.
    expect(streakDays([run(day(-1)), run(day(-2))], now)).toBe(2);
    // A missed day breaks it.
    expect(streakDays([run(day(0)), run(day(-2))], now)).toBe(1);
    expect(streakDays([run(day(-3))], now)).toBe(0);
  });

  it("totals a run", () => {
    expect(runTotal({ at: 0, results: [{ name: "C", ms: 700, misses: 0 }, { name: "G", ms: 300, misses: 2 }] })).toBe(1000);
  });
});
