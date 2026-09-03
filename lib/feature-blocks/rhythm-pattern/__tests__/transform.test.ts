import { describe, it, expect } from "vitest";
import {
  gridOnsets,
  assignOnsets,
  applyDurationRatio,
  transform,
} from "../transform";
import type { PracticeNote } from "../../preview-fixtures";

const config = {
  leftPattern: "1000",
  rightPattern: "0100",
  barsPerCycle: 1,
  durationRatio: 0.5,
};

function note(midi: number[]): PracticeNote {
  return { midi, pcs: new Set(midi.map((m) => m % 12)), symbol: "x" };
}

describe("gridOnsets", () => {
  it("reads each character as a 16th-note step", () => {
    expect(gridOnsets("1000", 1)).toEqual([0, 1, 2, 3]);
  });

  it("supports sub-beat resolution", () => {
    expect(gridOnsets("10", 1)).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
  });

  it("repeats the pattern across the cycle", () => {
    // Onset every 8 steps = every 2 beats, spanning 2 bars.
    expect(gridOnsets("10000000", 2)).toEqual([0, 2, 4, 6]);
  });

  it("returns no onsets for an all-rest pattern", () => {
    expect(gridOnsets("0000", 1)).toEqual([]);
  });
});

describe("assignOnsets", () => {
  const config = {
    leftPattern: "1000",
    rightPattern: "0000100000000000",
    barsPerCycle: 1,
    durationRatio: 0.5,
  };

  it("sends notes through the combined grid in order", () => {
    const [a, b] = assignOnsets([note([60]), note([62])], config);
    // Left grid owns beat 0, right grid owns beat 1.
    expect(a.onsetMs).toBe(0);
    expect(b.onsetMs).toBe(500); // beat 1 at 120bpm
    expect(a.hand).toBe("left");
    expect(b.hand).toBe("right");
  });

  it("applies the duration ratio exactly once", () => {
    const [a] = assignOnsets([note([60])], config);
    // One beat at 120bpm = 500ms; ratio 0.5 → 250ms.
    expect(a.durationMs).toBe(250);
  });

  it("wraps extra notes to the next cycle", () => {
    const [, , , , fifth] = assignOnsets(
      [note([60]), note([62]), note([64]), note([65]), note([67])],
      config
    );
    // Four onsets per cycle; the fifth note lands on beat 4 of the next.
    expect(fifth.onsetMs).toBe(2000);
  });

  it("keeps a source's own hand labels", () => {
    const input = { ...note([60]), hand: "right" as const };
    const [out] = assignOnsets([input], config);
    expect(out.hand).toBe("right");
  });

  it("returns notes untouched when the grids are all rests", () => {
    const input = [note([60])];
    const out = assignOnsets(
      input,
      { ...config, leftPattern: "0000", rightPattern: "0000" }
    );
    expect(out[0].onsetMs).toBeUndefined();
  });
});

describe("applyDurationRatio", () => {
  it("scales existing durations and leaves others alone", () => {
    const [a, b] = applyDurationRatio(
      [
        { midi: [60], pcs: new Set([0]), symbol: "", onsetMs: 0, durationMs: 400 },
        { midi: [62], pcs: new Set([2]), symbol: "" },
      ],
      0.25
    );
    expect(a.durationMs).toBe(100);
    expect(b.durationMs).toBeUndefined();
  });
});

describe("transform", () => {
  it("times a stream in one pass", () => {
    const out = transform([note([60]), note([64])], config);
    expect(out).toHaveLength(2);
    expect(out.every((n) => typeof n.onsetMs === "number")).toBe(true);
  });

  it("passes an empty stream through", () => {
    expect(transform([], config)).toEqual([]);
  });
});
