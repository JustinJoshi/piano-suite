import { describe, expect, it } from "vitest";

import {
  streamTargetsIdentity,
  targetsFromStream,
} from "@/lib/stream-targets";
import type { PracticeNote } from "@/lib/practice-note";

function note(overrides: Partial<PracticeNote>): PracticeNote {
  return { midi: [60], pcs: new Set([0]), symbol: "C", ...overrides };
}

describe("targetsFromStream", () => {
  it("returns an empty list for an empty stream", () => {
    expect(targetsFromStream([])).toEqual([]);
  });

  it("keeps repeated identical untimed chords distinct", () => {
    const targets = targetsFromStream([
      note({ symbol: "C", pcs: new Set([0, 4, 7]) }),
      note({ symbol: "C", pcs: new Set([0, 4, 7]) }),
    ]);
    expect(targets).toHaveLength(2);
    expect(targets[0].symbol).toBe("C");
    expect(targets[1].symbol).toBe("C");
  });

  it("groups consecutive timed notes at the same onset into one target", () => {
    const targets = targetsFromStream([
      note({ symbol: "C", pcs: new Set([0]), onsetMs: 0, durationMs: 500 }),
      note({ symbol: "E", pcs: new Set([4]), onsetMs: 0, durationMs: 500 }),
      note({ symbol: "G", pcs: new Set([7]), onsetMs: 0, durationMs: 500 }),
    ]);
    expect(targets).toHaveLength(1);
    expect(targets[0].symbol).toBe("C");
    expect([...targets[0].pcs].sort((a, b) => a - b)).toEqual([0, 4, 7]);
  });

  it("keeps distinct onsets as separate targets in source order", () => {
    const targets = targetsFromStream([
      note({ symbol: "C", pcs: new Set([0]), onsetMs: 0 }),
      note({ symbol: "F", pcs: new Set([5]), onsetMs: 480 }),
      note({ symbol: "G", pcs: new Set([7]), onsetMs: 960 }),
    ]);
    expect(targets.map((t) => t.symbol)).toEqual(["C", "F", "G"]);
  });

  it("skips empty pitch sets and accompaniment markers", () => {
    const targets = targetsFromStream([
      note({ symbol: "C", pcs: new Set([0]) }),
      note({ symbol: "acc", pcs: new Set([2, 5, 9]), midi: [38, 41, 45] }),
      note({ symbol: "?", pcs: new Set(), midi: [] }),
      note({ symbol: "F", pcs: new Set([5]) }),
    ]);
    expect(targets.map((t) => t.symbol)).toEqual(["C", "F"]);
  });

  it("does not merge across a restarted timeline at the same onset", () => {
    // Two ordered source runs concatenated: the second restarts at 0ms,
    // below run1's last onset of 400.
    const targets = targetsFromStream([
      note({ symbol: "run1-C", pcs: new Set([0]), onsetMs: 0, durationMs: 400 }),
      note({ symbol: "run1-E", pcs: new Set([4]), onsetMs: 0, durationMs: 400 }),
      note({ symbol: "run1-tail", pcs: new Set([2]), onsetMs: 400, durationMs: 400 }),
      note({ symbol: "run2-C", pcs: new Set([0]), onsetMs: 0, durationMs: 400 }),
      note({ symbol: "run2-G", pcs: new Set([7]), onsetMs: 0, durationMs: 400 }),
    ]);
    expect(targets).toHaveLength(3);
    expect(targets[0].pcs.has(4)).toBe(true);
    expect(targets[0].pcs.has(7)).toBe(false);
    expect(targets[2].pcs.has(7)).toBe(true);
    expect(targets[2].pcs.has(4)).toBe(false);
  });

  it("derives the label from music-theory helpers when no symbol exists", () => {
    const targets = targetsFromStream([
      { midi: [61], pcs: new Set([1]), symbol: "" },
    ]);
    expect(targets[0].symbol).not.toBe("");
    expect(targets[0].notes).toEqual([targets[0].symbol]);
  });
});

describe("streamTargetsIdentity", () => {
  const base = targetsFromStream([
    note({ symbol: "Cmaj", pcs: new Set([0, 4, 7]), onsetMs: 0 }),
    note({ symbol: "Fmaj", pcs: new Set([5, 9, 0]), onsetMs: 500 }),
  ]);

  it("is unchanged when only onset/duration milliseconds change", () => {
    const retimed = targetsFromStream([
      note({ symbol: "Cmaj", pcs: new Set([0, 4, 7]), onsetMs: 120 }),
      note({ symbol: "Fmaj", pcs: new Set([5, 9, 0]), onsetMs: 900 }),
    ]);
    expect(streamTargetsIdentity(retimed)).toBe(streamTargetsIdentity(base));
  });

  it("changes when pitch content changes", () => {
    const altered = targetsFromStream([
      note({ symbol: "Cmaj", pcs: new Set([0, 4, 7]), onsetMs: 0 }),
      note({ symbol: "G7", pcs: new Set([7, 11, 2]), onsetMs: 500 }),
    ]);
    expect(streamTargetsIdentity(altered)).not.toBe(streamTargetsIdentity(base));
  });
});
