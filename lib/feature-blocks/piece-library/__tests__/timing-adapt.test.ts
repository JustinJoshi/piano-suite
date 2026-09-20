import { describe, it, expect } from "vitest";
import { adaptNote, notesFromParsedMidi, streamDurationMs } from "../adapt";
import { barCount, barWindows } from "@/lib/midi-musical-time";
import type { ParsedMidi, MusicPlayerNote } from "@/lib/music-player";
import type { SourceTiming } from "@/lib/practice-note";
import { pieceLibraryDefaultConfig } from "../config";

const PPQ = 480;

const TIMING: SourceTiming = Object.freeze({
  ppq: PPQ,
  totalTicks: 4 * 1920,
  tempos: Object.freeze([{ tick: 0, bpm: 120 }]),
  meters: Object.freeze([{ tick: 0, numerator: 4, denominator: 4 }]),
});

function noteWith(
  tick: number,
  opts: { time: number; duration: number; durationTicks: number; note: number }
): MusicPlayerNote {
  return {
    note: opts.note,
    pc: ((opts.note % 12) + 12) % 12,
    velocity: 90,
    time: opts.time,
    duration: opts.duration,
    ticks: tick,
    durationTicks: opts.durationTicks,
  };
}

describe("adaptNote with source timing", () => {
  it("carries source bar/beat coordinates and ticks", () => {
    // First quarter of bar 1: tick 1920 + 120.
    const source = {
      ...noteWith(2040, { time: 0, duration: 0.25, durationTicks: 240, note: 60 }),
    };
    const adapted = adaptNote(source, 0, TIMING);
    expect(adapted.source).toMatchObject({
      tick: 2040,
      durationTicks: 240,
      bar: 1,
      beat: 0.25,
    });
    expect(adapted.onsetMs).toBe(0);
  });

  it("does not mutate the source note", () => {
    const source = noteWith(0, { time: 0, duration: 0.5, durationTicks: 480, note: 60 });
    const snapshot = { ...source };
    adaptNote(source, 3, TIMING);
    expect(source).toEqual(
      expect.objectContaining(snapshot) && snapshot
    );
  });

  it("adapts on the legacy time-only path without timing metadata", () => {
    const legacy: ParsedMidi = {
      kind: "midi",
      duration: 1,
      notes: [{ note: 60, pc: 0, velocity: 100, time: 0, duration: 0.5 }],
    };
    const adapted = adaptNote(legacy.notes[0], 0);
    expect(adapted.source).toBeUndefined();
    expect(adapted.onsetMs).toBe(0);
    expect(adapted.durationMs).toBe(500);
  });

  it("falls back to the legacy path when metadata is partial", () => {
    const partial = {
      note: 60, pc: 0, velocity: 100, time: 0, duration: 0.5,
      ticks: 0,
    };
    const adapted = adaptNote(partial, 0, TIMING);
    expect(adapted.source).toBeUndefined();
  });
});

describe("notesFromParsedMidi carries the coordinate system", () => {
  it("shares one frozen timing object across all adapted notes", () => {
    const parsed: ParsedMidi = {
      kind: "midi",
      duration: 2,
      timing: TIMING,
      notes: [
        noteWith(0, { time: 0, duration: 0.5, durationTicks: 480, note: 60 }),
        noteWith(2400, { time: 1, duration: 0.5, durationTicks: 240, note: 67 }),
      ],
    };
    const notes = notesFromParsedMidi(parsed, pieceLibraryDefaultConfig);
    expect(notes[0].source).toBeDefined();
    expect(notes[0].source!.timing).toBe(notes[1].source!.timing);
    expect(Object.isFrozen(notes[0].source!.timing)).toBe(true);
    expect(barCount(notes[0].source!.timing)).toBe(4);
  });

  it("keeps source coordinates through notesFromParsedMidi", () => {
    const parsed: ParsedMidi = {
      kind: "midi",
      duration: 1.5,
      timing: TIMING,
      notes: [noteWith(2040, { time: 0.5, duration: 0.25, durationTicks: 240, note: 60 })],
    };
    const notes = notesFromParsedMidi(parsed, pieceLibraryDefaultConfig);
    expect(notes[0].source!.bar).toBe(1);
    expect(notes[0].source!.beat).toBeCloseTo(0.25);
    expect(streamDurationMs(notes)).toBeCloseTo(750);
  });

  it("recovers full bar windows for 3/4 pieces including rest bars", () => {
    const timing: SourceTiming = Object.freeze({
      ppq: PPQ,
      totalTicks: 3 * 1440,
      tempos: Object.freeze([{ tick: 0, bpm: 120 }]),
      meters: Object.freeze([{ tick: 0, numerator: 3, denominator: 4 }]),
    });
    const windows = barWindows(timing);
    expect(windows.map((w) => [w.startTick, w.endTick])).toEqual([
      [0, 1440],
      [1440, 2880],
      [2880, 4320],
    ]);
    // Middle bar empty is still recoverable geometry.
    expect(barCount(timing)).toBe(3);
  });

  it("legacy parsed fixtures adapt unchanged (no timing field)", () => {
    const parsed: ParsedMidi = {
      kind: "midi",
      duration: 0.75,
      notes: [
        { note: 67, pc: 7, velocity: 90, time: 0.5, duration: 0.25 },
        { note: 60, pc: 0, velocity: 100, time: 0, duration: 0.5 },
      ],
    };
    const notes = notesFromParsedMidi(parsed, pieceLibraryDefaultConfig);
    expect(notes[0].source).toBeUndefined();
    expect(notes[0].onsetMs).toBe(0);
    expect(notes[1].onsetMs).toBe(500);
  });
});
