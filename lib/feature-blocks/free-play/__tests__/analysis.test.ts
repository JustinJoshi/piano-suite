import { describe, it, expect } from "vitest";
import {
  inScaleRatio,
  pitchRange,
  notesPerSecond,
  pcHistogram,
  scalePcsFor,
} from "../analysis";

describe("inScaleRatio", () => {
  const cMajorPentatonic = new Set([0, 2, 4, 7, 9]);

  it("returns 1 for empty input", () => {
    expect(inScaleRatio([], cMajorPentatonic)).toBe(1);
  });

  it("counts in-scale pitch classes", () => {
    expect(inScaleRatio([0, 4, 7, 1], cMajorPentatonic)).toBe(0.75);
  });
});

describe("pitchRange", () => {
  it("returns null for empty input", () => {
    expect(pitchRange([])).toBeNull();
  });

  it("spans low to high", () => {
    expect(pitchRange([67, 60, 72])).toEqual({ low: 60, high: 72, span: 12 });
  });
});

describe("notesPerSecond", () => {
  it("counts only notes inside the window", () => {
    const now = 10_000;
    const timestamps = [9_000, 9_500, 5_000, 10_100];
    // Two notes in the last 2 seconds.
    expect(notesPerSecond(timestamps, 2_000, now)).toBeCloseTo(1.0);
  });

  it("returns 0 when the window is empty", () => {
    expect(notesPerSecond([1_000], 2_000, 10_000)).toBe(0);
  });
});

describe("pcHistogram", () => {
  it("normalizes pitch classes across octaves", () => {
    const histogram = pcHistogram([60, 72, 61]);
    expect(histogram.get(0)).toBe(2);
    expect(histogram.get(1)).toBe(1);
  });
});

describe("scalePcsFor", () => {
  it("builds the scale's pitch classes at a root", () => {
    expect(scalePcsFor("majorPentatonic", "C")).toEqual(new Set([0, 2, 4, 7, 9]));
    expect(scalePcsFor("majorPentatonic", "D")).toEqual(new Set([2, 4, 6, 9, 11]));
  });

  it("returns an empty set for unknown scales", () => {
    expect(scalePcsFor("not-a-scale", "C")).toEqual(new Set());
  });
});
