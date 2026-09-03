import { describe, it, expect } from "vitest";
import { adaptNote, notesFromParsedMidi, streamDurationMs } from "../adapt";
import type { ParsedMidi } from "@/lib/music-player";
import { pieceLibraryDefaultConfig } from "../config";

const parsed: ParsedMidi = {
  kind: "midi",
  duration: 2,
  notes: [
    { note: 67, pc: 7, velocity: 90, time: 0.5, duration: 0.25 },
    { note: 60, pc: 0, velocity: 100, time: 0, duration: 0.5 },
  ],
};

describe("adaptNote", () => {
  it("converts seconds to milliseconds and keeps pitch class", () => {
    const note = adaptNote(parsed.notes[0], 0);
    expect(note.onsetMs).toBe(500);
    expect(note.durationMs).toBe(250);
    expect(note.pcs).toEqual(new Set([7]));
  });

  it("transposes and renormalizes the pitch class", () => {
    const note = adaptNote(parsed.notes[0], 5);
    expect(note.midi).toEqual([72]);
    expect(note.pcs).toEqual(new Set([0]));
  });
});

describe("notesFromParsedMidi", () => {
  it("sorts notes by onset", () => {
    const notes = notesFromParsedMidi(parsed, pieceLibraryDefaultConfig);
    expect(notes[0].midi).toEqual([60]);
    expect(notes[1].midi).toEqual([67]);
  });

  it("marks accompaniment streams", () => {
    const notes = notesFromParsedMidi(parsed, {
      ...pieceLibraryDefaultConfig,
      role: "accompaniment",
    });
    expect(notes.every((n) => n.symbol === "acc")).toBe(true);
  });
});

describe("streamDurationMs", () => {
  it("returns the end of the last note", () => {
    const notes = notesFromParsedMidi(parsed, pieceLibraryDefaultConfig);
    expect(streamDurationMs(notes)).toBe(750);
  });
});
