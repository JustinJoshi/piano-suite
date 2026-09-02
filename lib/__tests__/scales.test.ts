import { describe, it, expect } from "vitest";
import {
  SCALE_TYPES,
  scaleDefinition,
  ascendingOffsets,
  applyPattern,
  applyDirection,
  buildScaleSteps,
  scaleRunLabel,
} from "@/lib/scales";

describe("scaleDefinition", () => {
  it("returns null for an unknown id", () => {
    expect(scaleDefinition("not-a-scale")).toBeNull();
  });

  it("gives every scale a unique id", () => {
    const ids = SCALE_TYPES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every interval inside one octave and ascending", () => {
    for (const scale of SCALE_TYPES) {
      expect(scale.intervals[0]).toBe(0);
      expect(Math.max(...scale.intervals)).toBeLessThan(12);
      const sorted = [...scale.intervals].sort((a, b) => a - b);
      expect(scale.intervals).toEqual(sorted);
    }
  });
});

describe("ascendingOffsets", () => {
  const major = [0, 2, 4, 5, 7, 9, 11];

  it("takes the first five degrees for a pentascale and does not resolve", () => {
    expect(ascendingOffsets(major, "pentascale")).toEqual([0, 2, 4, 5, 7]);
  });

  it("resolves on the octave for a one-octave run", () => {
    expect(ascendingOffsets(major, "octave")).toEqual([0, 2, 4, 5, 7, 9, 11, 12]);
  });

  it("spans two octaves and resolves on 24", () => {
    const offsets = ascendingOffsets(major, "twoOctaves");
    expect(offsets).toHaveLength(15);
    expect(offsets[0]).toBe(0);
    expect(offsets[7]).toBe(12);
    expect(offsets.at(-1)).toBe(24);
  });

  it("returns nothing for an empty scale", () => {
    expect(ascendingOffsets([], "octave")).toEqual([]);
  });

  it("caps a pentascale at the scale length when the scale is shorter", () => {
    expect(ascendingOffsets([0, 3, 5], "pentascale")).toEqual([0, 3, 5]);
  });
});

describe("applyPattern", () => {
  const run = [0, 2, 4, 5, 7];

  it("leaves a straight run alone", () => {
    expect(applyPattern(run, "straight")).toEqual(run);
  });

  it("walks broken thirds as overlapping pairs", () => {
    expect(applyPattern(run, "thirds")).toEqual([0, 4, 2, 5, 4, 7]);
  });

  it("walks broken triads as overlapping triples", () => {
    expect(applyPattern(run, "triads")).toEqual([0, 4, 7]);
  });

  it("falls back to straight when the run is too short for the pattern", () => {
    expect(applyPattern([0, 2], "thirds")).toEqual([0, 2]);
    expect(applyPattern([0, 2, 4], "triads")).toEqual([0, 2, 4]);
  });
});

describe("applyDirection", () => {
  it("reverses for down", () => {
    expect(applyDirection([0, 2, 4], "down")).toEqual([4, 2, 0]);
  });

  it("does not repeat the turnaround note for up-and-down", () => {
    expect(applyDirection([0, 2, 4], "upDown")).toEqual([0, 2, 4, 2, 0]);
  });

  it("handles an empty run", () => {
    expect(applyDirection([], "upDown")).toEqual([]);
  });
});

describe("buildScaleSteps", () => {
  it("names a C major octave run and labels its degrees", () => {
    const steps = buildScaleSteps({
      rootPc: 0,
      scaleId: "major",
      span: "octave",
      pattern: "straight",
      direction: "up",
    });

    expect(steps.map((s) => s.name)).toEqual([
      "C",
      "D",
      "E",
      "F",
      "G",
      "A",
      "B",
      "C",
    ]);
    // The closing tonic is degree 1 again, an octave up.
    expect(steps.map((s) => s.degree)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "1",
    ]);
    expect(steps.at(-1)?.offset).toBe(12);
  });

  it("spells with flats when asked", () => {
    const steps = buildScaleSteps({
      rootPc: 10,
      useFlats: true,
      scaleId: "major",
      span: "pentascale",
      pattern: "straight",
      direction: "up",
    });
    expect(steps.map((s) => s.name)).toEqual(["Bb", "C", "D", "Eb", "F"]);
  });

  it("returns nothing for an unknown scale rather than throwing", () => {
    expect(
      buildScaleSteps({
        rootPc: 0,
        scaleId: "nope",
        span: "octave",
        pattern: "straight",
        direction: "up",
      })
    ).toEqual([]);
  });

  it("doubles the step count for two octaves", () => {
    const one = buildScaleSteps({
      rootPc: 0,
      scaleId: "major",
      span: "octave",
      pattern: "straight",
      direction: "up",
    });
    const two = buildScaleSteps({
      rootPc: 0,
      scaleId: "major",
      span: "twoOctaves",
      pattern: "straight",
      direction: "up",
    });
    expect(two.length).toBeGreaterThan(one.length);
    expect(two).toHaveLength(15);
  });

  it("leaves the degree blank for notes outside the scale", () => {
    const steps = buildScaleSteps({
      rootPc: 0,
      scaleId: "chromatic",
      span: "octave",
      pattern: "straight",
      direction: "up",
    });
    // Every chromatic note is "in" the chromatic scale, so all are labelled.
    expect(steps.every((s) => s.degree !== "")).toBe(true);
  });
});

describe("scaleRunLabel", () => {
  it("reads as a practice instruction", () => {
    expect(scaleRunLabel("C", "major", "twoOctaves")).toBe(
      "C Major (Ionian) · 2 oct"
    );
    expect(scaleRunLabel("A", "naturalMinor", "pentascale")).toBe(
      "A Natural minor (Aeolian) · 5-finger"
    );
  });
});
