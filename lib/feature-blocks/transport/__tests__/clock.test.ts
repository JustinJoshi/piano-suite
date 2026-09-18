import { describe, it, expect } from "vitest";
import {
  beatsToMs,
  msToBeat,
  sectionRange,
  rampTempo,
  beatInBar,
  barNumber,
  rampedBpm,
} from "../clock";

describe("transport clock math", () => {
  it("converts beats to milliseconds", () => {
    expect(beatsToMs(1, 120)).toBe(500);
    expect(beatsToMs(4, 60)).toBe(4000);
    expect(beatsToMs(0, 120)).toBe(0);
  });

  it("converts milliseconds to beats", () => {
    expect(msToBeat(500, 120)).toBe(1);
    expect(msToBeat(4000, 60)).toBe(4);
  });

  it("round-trips beats through milliseconds", () => {
    expect(msToBeat(beatsToMs(3.5, 90), 90)).toBeCloseTo(3.5);
  });

  it("computes a section range from bar numbers", () => {
    const range = sectionRange({
      bpm: 120,
      beatsPerBar: 4,
      sectionStartBar: 0,
      sectionEndBar: 4,
    });
    expect(range.startMs).toBe(0);
    expect(range.endMs).toBe(8000);
  });

  it("ramps tempo linearly and clamps progress", () => {
    expect(rampTempo(60, 120, 0)).toBe(60);
    expect(rampTempo(60, 120, 0.5)).toBe(90);
    expect(rampTempo(60, 120, 1)).toBe(120);
    expect(rampTempo(60, 120, -1)).toBe(60);
    expect(rampTempo(60, 120, 2)).toBe(120);
  });

  it("locates the beat within a bar and the bar number", () => {
    expect(beatInBar(0, 4)).toBe(0);
    expect(beatInBar(5, 4)).toBe(1);
    expect(barNumber(5, 4)).toBe(1);
    expect(barNumber(0, 4)).toBe(0);
  });
});

describe("rampedBpm", () => {
  it("starts at the start bpm before any reps complete", () => {
    expect(rampedBpm(60, 120, 0)).toBe(60);
  });

  it("interpolates linearly over the default 8 reps", () => {
    expect(rampedBpm(60, 100, 4)).toBe(80);
  });

  it("clamps to the target past the end of the ramp", () => {
    expect(rampedBpm(60, 100, 8)).toBe(100);
    expect(rampedBpm(60, 100, 50)).toBe(100);
  });

  it("ramps down without dropping below the target", () => {
    expect(rampedBpm(120, 90, 0)).toBe(120);
    expect(rampedBpm(120, 90, 4)).toBe(105);
    expect(rampedBpm(120, 90, 8)).toBe(90);
    expect(rampedBpm(120, 90, 20)).toBe(90);
  });

  it("honours rampOverReps of 1", () => {
    expect(rampedBpm(60, 120, 0, 1)).toBe(60);
    expect(rampedBpm(60, 120, 1, 1)).toBe(120);
  });
});
