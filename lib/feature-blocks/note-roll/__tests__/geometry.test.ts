import { describe, it, expect } from "vitest";
import {
  visibleNotes,
  noteY,
  noteHeight,
  filterByHand,
  type RollNote,
} from "../geometry";

const config = { lookaheadMs: 2000, scrollSpeed: 300 };

const roll: RollNote[] = [
  { midi: [60], pcs: undefined, onsetMs: 0, durationMs: 500, hand: "right", symbol: "C" },
  { midi: [64], pcs: undefined, onsetMs: 1500, durationMs: 500, hand: "left", symbol: "E" },
  { midi: [67], pcs: undefined, onsetMs: 5000, durationMs: 500, hand: "right", symbol: "G" },
] as unknown as RollNote[];

describe("visibleNotes", () => {
  it("shows notes within the lookahead window", () => {
    const now = 400;
    const visible = visibleNotes(roll, now, config);
    // Note 1 is sounding (ends at 500ms), note 2 is ahead within the
    // window, note 3 (5000ms) is far outside the 2000ms lookahead.
    expect(visible.map((n) => n.symbol)).toEqual(["C", "E"]);
  });

  it("drops a note once it has fully scrolled past", () => {
    // Note 1 ends at 500ms; at nowMs 600 it should be gone.
    expect(visibleNotes(roll, 600, config).map((n) => n.symbol)).toEqual(["E"]);
  });
});

describe("noteY", () => {
  it("puts a note at the hit line when now equals onset", () => {
    expect(noteY(roll[0], 0, 300)).toBe(0);
  });

  it("puts upcoming notes above the line", () => {
    expect(noteY(roll[1], 1000, 300)).toBe(-150); // 500ms early × 0.3 px/ms
  });

  it("puts passed notes below the line", () => {
    expect(noteY(roll[0], 500, 300)).toBe(150);
  });
});

describe("noteHeight", () => {
  it("scales with duration and never collapses", () => {
    expect(noteHeight(roll[0], 300)).toBe(150);
    const tiny: RollNote = { ...roll[0], durationMs: 5 };
    expect(noteHeight(tiny, 300)).toBe(8);
  });
});

describe("filterByHand", () => {
  it("keeps everything for both", () => {
    expect(filterByHand(roll, "both")).toHaveLength(3);
  });

  it("filters by hand", () => {
    expect(filterByHand(roll, "left").map((n) => n.symbol)).toEqual(["E"]);
  });
});
