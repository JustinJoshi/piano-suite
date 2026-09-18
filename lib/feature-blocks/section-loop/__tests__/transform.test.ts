import { describe, it, expect } from "vitest";
import { transform } from "../transform";
import type { PracticeNote } from "../../../practice-note";

// 120bpm, 4/4: one bar = 2000ms.
function note(symbol: string, onsetMs: number): PracticeNote {
  return { midi: [60], pcs: new Set([0]), symbol, onsetMs };
}

describe("sectionLoop transform", () => {
  it("keeps notes at a boundary onset (start inclusive, end exclusive)", () => {
    // Window bars 1–2 → [2000, 4000).
    const config = { startBar: 1, endBar: 2, repeats: 1 };
    const out = transform(
      [
        note("before", 1999.99),
        note("atStart", 2000),
        note("inside", 3000),
        note("atEnd", 4000),
      ],
      config
    );
    expect(out.map((n) => n.symbol)).toEqual(["atStart", "inside"]);
  });

  it("rebases the window so the section starts at 0", () => {
    const config = { startBar: 2, endBar: 4, repeats: 1 };
    const out = transform([note("a", 5000), note("b", 7000)], config);
    expect(out[0].onsetMs).toBe(1000);
    expect(out[1].onsetMs).toBe(3000);
  });

  it("repeats: 3 produces three copies with correct offsets", () => {
    const config = { startBar: 0, endBar: 1, repeats: 3 };
    const out = transform([note("a", 500)], config);
    expect(out).toHaveLength(3);
    expect(out.map((n) => n.onsetMs)).toEqual([500, 2500, 4500]);
  });

  it("returns [] for an empty window rather than throwing", () => {
    const config = { startBar: 10, endBar: 11, repeats: 2 };
    expect(transform([note("a", 0), note("b", 1000)], config)).toEqual([]);
    expect(transform([], config)).toEqual([]);
  });

  it("repeats: 1 is a plain slice, rebased", () => {
    const config = { startBar: 1, endBar: 3, repeats: 1 };
    const out = transform(
      [note("a", 0), note("b", 2000), note("c", 4500), note("d", 8000)],
      config
    );
    expect(out.map((n) => n.symbol)).toEqual(["b", "c"]);
    expect(out[0].onsetMs).toBe(0);
    expect(out[1].onsetMs).toBe(2500);
  });

  it("passes notes without an onset through untouched at the front", () => {
    const config = { startBar: 0, endBar: 1, repeats: 2 };
    const headless: PracticeNote = { midi: [64], pcs: new Set([4]), symbol: "head" };
    const out = transform([headless, note("a", 500)], config);
    expect(out[0]).toEqual(headless);
    expect(out[1].onsetMs).toBe(500);
    expect(out[2].onsetMs).toBe(2500);
  });

  it("honors bpm and beatsPerBar through sectionRange", () => {
    // 60bpm, 3/4: one bar = 3000ms. Window bars 1–2 → [3000, 6000).
    const config = { startBar: 1, endBar: 2, repeats: 2 };
    const out = transform([note("a", 4000)], config, 60, 3);
    expect(out.map((n) => n.onsetMs)).toEqual([1000, 4000]);
  });
});
