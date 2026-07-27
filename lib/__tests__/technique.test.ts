import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  todayStr,
  daysAgoStr,
  computeStreak,
  buildGrid,
  type TechniqueLog,
} from "@/lib/technique";

describe("technique helpers", () => {
  beforeEach(() => {
    // Pin "today" to 2026-07-27 so streak/grid math is deterministic.
    const fixed = new Date("2026-07-27T12:00:00.000Z");
    vi.setSystemTime(fixed);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("todayStr returns UTC YYYY-MM-DD", () => {
    expect(todayStr()).toBe("2026-07-27");
  });

  it("daysAgoStr returns the right past dates", () => {
    expect(daysAgoStr(0)).toBe("2026-07-27");
    expect(daysAgoStr(1)).toBe("2026-07-26");
    expect(daysAgoStr(27)).toBe("2026-06-30");
  });

  it("computeStreak counts consecutive days from today backward", () => {
    const log: TechniqueLog = {
      "2026-07-27": { bpm: 80 },
      "2026-07-26": { bpm: 78 },
      "2026-07-25": { bpm: 76 },
      "2026-07-23": { bpm: 72 }, // gap on 07/24 breaks streak
    };
    expect(computeStreak(log)).toBe(3);
  });

  it("computeStreak returns 0 when nothing was done today", () => {
    const log: TechniqueLog = {
      "2026-07-26": { bpm: 80 },
      "2026-07-25": { bpm: 78 },
    };
    expect(computeStreak(log)).toBe(0);
  });

  it("computeStreak returns 0 for an empty log", () => {
    expect(computeStreak({})).toBe(0);
  });

  it("buildGrid returns the last N days with done/today flags", () => {
    const log: TechniqueLog = {
      [todayStr()]: { bpm: 90 },
      [daysAgoStr(3)]: { bpm: 80 },
    };
    const grid = buildGrid(log, 7);

    expect(grid).toHaveLength(7);
    expect(grid[6].date).toBe(todayStr());
    expect(grid[6].done).toBe(true);
    expect(grid[6].isToday).toBe(true);
    expect(grid[6].bpm).toBe(90);

    expect(grid[3].date).toBe(daysAgoStr(3));
    expect(grid[3].done).toBe(true);
    expect(grid[3].bpm).toBe(80);

    expect(grid[0].date).toBe(daysAgoStr(6));
    expect(grid[0].done).toBe(false);
    expect(grid[0].isToday).toBe(false);
  });
});
