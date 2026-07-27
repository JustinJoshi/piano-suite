import { describe, it, expect } from "vitest";
import {
  pitchClassSetOf,
  setsEqual,
  isSubset,
  evaluateChordAttempt,
  evaluateSequenceAttempt,
} from "@/lib/scoring";

describe("pitchClassSetOf", () => {
  it("converts MIDI notes to pitch classes", () => {
    expect(pitchClassSetOf([60, 64, 67, 71])).toEqual(new Set([0, 4, 7, 11]));
  });

  it("deduplicates octaves", () => {
    expect(pitchClassSetOf([60, 72, 84])).toEqual(new Set([0]));
  });

  it("handles negative and out-of-range notes", () => {
    expect(pitchClassSetOf([-1, 13, 25])).toEqual(new Set([11, 1]));
  });
});

describe("setsEqual", () => {
  it("returns true for identical sets", () => {
    expect(setsEqual(new Set([0, 4, 7]), new Set([0, 4, 7]))).toBe(true);
  });

  it("returns false for different sizes", () => {
    expect(setsEqual(new Set([0, 4, 7]), new Set([0, 4, 7, 11]))).toBe(false);
  });

  it("returns false for same size different content", () => {
    expect(setsEqual(new Set([0, 4, 7]), new Set([0, 4, 8]))).toBe(false);
  });
});

describe("isSubset", () => {
  it("returns true when target is fully contained", () => {
    expect(isSubset(new Set([0, 4]), new Set([0, 4, 7, 11]))).toBe(true);
  });

  it("returns false when target is missing notes", () => {
    expect(isSubset(new Set([0, 4, 7]), new Set([0, 4]))).toBe(false);
  });

  it("returns true for empty target", () => {
    expect(isSubset(new Set(), new Set([0, 4, 7]))).toBe(true);
  });
});

describe("evaluateChordAttempt", () => {
  const cMajor7 = new Set([0, 4, 7, 11]);

  it("marks exact match as correct", () => {
    const result = evaluateChordAttempt(cMajor7, new Set([0, 4, 7, 11]));
    expect(result.correct).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.extra).toEqual([]);
  });

  it("marks missing notes as incorrect", () => {
    const result = evaluateChordAttempt(cMajor7, new Set([0, 4, 7]));
    expect(result.correct).toBe(false);
    expect(result.missing).toContain(11);
    expect(result.extra).toEqual([]);
  });

  it("marks extra notes as incorrect when requireExact is true", () => {
    const result = evaluateChordAttempt(cMajor7, new Set([0, 4, 7, 11, 2]));
    expect(result.correct).toBe(false);
    expect(result.missing).toEqual([]);
    expect(result.extra).toContain(2);
  });

  it("allows extra notes when requireExact is false", () => {
    const result = evaluateChordAttempt(cMajor7, new Set([0, 4, 7, 11, 2]), {
      requireExact: false,
    });
    expect(result.correct).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.extra).toContain(2);
  });

  it("reports both missing and extra notes", () => {
    const result = evaluateChordAttempt(cMajor7, new Set([0, 4, 2, 5]));
    expect(result.correct).toBe(false);
    expect(result.missing).toEqual([7, 11]);
    expect(result.extra).toEqual([2, 5]);
  });
});

describe("evaluateSequenceAttempt", () => {
  const sequence = [0, 3, 7, 10, 14, 17, 21];

  it("advances on correct note", () => {
    const result = evaluateSequenceAttempt(sequence, [60], 0);
    expect(result.correct).toBe(true);
    expect(result.expected).toBe(0);
    expect(result.nextIndex).toBe(1);
  });

  it("does not advance on wrong note", () => {
    const result = evaluateSequenceAttempt(sequence, [61], 0);
    expect(result.correct).toBe(false);
    expect(result.expected).toBe(0);
    expect(result.nextIndex).toBe(0);
    expect(result.played).toBe(61);
  });

  it("reports null played when no notes held", () => {
    const result = evaluateSequenceAttempt(sequence, [], 0);
    expect(result.correct).toBe(false);
    expect(result.played).toBeNull();
  });

  it("advances through the whole sequence", () => {
    let index = 0;
    for (const expected of sequence) {
      const result = evaluateSequenceAttempt(sequence, [expected + 60], index);
      expect(result.correct).toBe(true);
      index = result.nextIndex;
    }
    expect(index).toBe(sequence.length);
  });

  it("accepts any octave of the expected pitch class", () => {
    const result = evaluateSequenceAttempt(sequence, [72], 0); // C5 instead of C4
    expect(result.correct).toBe(true);
    expect(result.nextIndex).toBe(1);
  });

  it("throws on out-of-bounds index", () => {
    expect(() => evaluateSequenceAttempt(sequence, [60], -1)).toThrow();
    expect(() => evaluateSequenceAttempt(sequence, [60], sequence.length)).toThrow();
  });
});
