import { describe, it, expect } from "vitest";
import {
  expandCell,
  parseCell,
  generateScale,
} from "../generate";
import { scaleLibraryDefaultConfig } from "../config";

describe("parseCell", () => {
  it("parses digits and ignores everything else", () => {
    expect(parseCell("1235")).toEqual([1, 2, 3, 5]);
    expect(parseCell("1-2 3")).toEqual([1, 2, 3]);
  });
});

describe("expandCell", () => {
  it("expands a Hanon-style cell over the run", () => {
    // C major ascending over one octave: degrees 1..8.
    const run = [0, 2, 4, 5, 7, 9, 11, 12];
    const expanded = expandCell(run, [1, 2, 3, 5]);
    // From step 0: 1,2,3,5 → 0,2,4,7. From step 1: 2,3,4,6 → 2,4,5,9…
    expect(expanded.slice(0, 4)).toEqual([0, 2, 4, 7]);
    expect(expanded.slice(4, 8)).toEqual([2, 4, 5, 9]);
  });

  it("drops degrees past the end of the run", () => {
    const run = [0, 2, 4];
    // Degree 1 of each start survives; degree 5 never fits.
    expect(expandCell(run, [1, 5])).toEqual([0, 2, 4]);
  });

  it("returns the run unchanged for an empty cell", () => {
    const run = [0, 2, 4];
    expect(expandCell(run, [])).toEqual(run);
  });
});

describe("generateScale", () => {
  it("generates a straight C major octave up-down", () => {
    const config = { ...scaleLibraryDefaultConfig };
    const notes = generateScale(config);
    // 8 up + 7 back down (turnaround not repeated).
    expect(notes).toHaveLength(15);
    expect(notes[0].symbol).toBe("C");
    expect(notes[0].midi).toEqual([60]);
    expect(notes[7].midi).toEqual([72]);
  });

  it("supports the custom cell pattern", () => {
    const config = {
      ...scaleLibraryDefaultConfig,
      pattern: "custom" as const,
      customCell: "1231",
      direction: "up" as const,
    };
    const notes = generateScale(config);
    // Six full 4-note groups, then truncated starts at degrees 7 and 8.
    expect(notes).toHaveLength(29);
    expect(notes.map((n) => n.symbol).slice(0, 4)).toEqual(["C", "D", "E", "C"]);
  });

  it("respects the hand selection", () => {
    const right = generateScale({
      ...scaleLibraryDefaultConfig,
      hands: "right",
    });
    expect(right[0].hand).toBe("right");

    const both = generateScale({ ...scaleLibraryDefaultConfig, hands: "both" });
    expect(both[0].hand).toBeUndefined();
  });

  it("repeats the run loopCount times", () => {
    const notes = generateScale({ ...scaleLibraryDefaultConfig, loopCount: 2 });
    expect(notes).toHaveLength(30);
  });

  it("returns an empty stream for an unknown scale", () => {
    const notes = generateScale({
      ...scaleLibraryDefaultConfig,
      scale: "not-a-scale",
    });
    expect(notes).toEqual([]);
  });
});
