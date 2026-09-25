import { describe, expect, it } from "vitest";
import {
  LOOP_TEMPI,
  ROLL_HIGH,
  ROLL_LANES,
  ROLL_LOW,
  ROLL_MOTIFS,
  ROLL_PASSAGES,
  noteAbove,
  notesSoundingAt,
} from "@/lib/roll-music";

describe("roll music", () => {
  it("spans C3 to C6, one lane per semitone", () => {
    expect(ROLL_LOW).toBe(48);
    expect(ROLL_HIGH).toBe(84);
    expect(ROLL_LANES).toBe(37);
  });

  it.each(Object.entries(ROLL_PASSAGES))(
    "%s keeps every note on the roll and inside its own height",
    (_, passage) => {
      expect(passage.notes.length).toBeGreaterThan(0);
      expect(passage.bpm).toBeGreaterThan(0);
      for (const note of passage.notes) {
        expect(note.p).toBeGreaterThanOrEqual(ROLL_LOW);
        expect(note.p).toBeLessThanOrEqual(ROLL_HIGH);
        expect(note.t).toBeGreaterThanOrEqual(0);
        expect(note.d).toBeGreaterThan(0);
        expect(note.t + note.d).toBeLessThanOrEqual(passage.beats);
      }
    }
  );

  it("prints each pass of the loop shorter than the last, so it speeds up at a steady scroll", () => {
    const { starts } = ROLL_PASSAGES.loop;
    expect(starts).toHaveLength(LOOP_TEMPI.length);
    const lengths = starts!.slice(1).map((s, i) => s - starts![i]);
    for (let i = 1; i < lengths.length; i++) {
      expect(lengths[i]).toBeLessThan(lengths[i - 1]);
    }
  });

  it("finds the lowest note of a pitch class at or above a floor", () => {
    expect(noteAbove(4, 60)).toBe(64);
    expect(noteAbove(0, 60)).toBe(60);
    expect(noteAbove(11, 60)).toBe(71);
    expect(noteAbove(10, 61)).toBe(70);
  });

  it("reports notes sounding at a beat as half-open intervals", () => {
    const p = ROLL_PASSAGES.chordDrill;
    expect(notesSoundingAt(p, 0)).toEqual([]);
    expect(notesSoundingAt(p, 0.25)).toEqual([0, 1, 2, 3]);
    // A note stops sounding exactly at onset + duration.
    expect(notesSoundingAt(p, 1.5)).toEqual([]);
  });

  it("draws every catalogue motif in twelve lanes", () => {
    for (const motif of Object.values(ROLL_MOTIFS)) {
      for (const [lane, t, d] of motif) {
        expect(lane).toBeGreaterThanOrEqual(0);
        expect(lane).toBeLessThan(12);
        expect(t).toBeGreaterThanOrEqual(0);
        expect(d).toBeGreaterThan(0);
      }
    }
  });
});
