import { describe, it, expect } from "vitest";
import { notesFromParsedMidi } from "../adapt";
import type { HandAssignment } from "../adapt";
import type { ParsedMidi, ParsedMidiTrack } from "@/lib/music-player";
import { pieceLibraryDefaultConfig } from "../config";

function makeParsed(
  notes: { note: number; trackIndex: number }[],
  tracks: ParsedMidiTrack[]
): ParsedMidi {
  return {
    kind: "midi",
    duration: 2,
    notes: notes.map((n) => ({
      note: n.note,
      pc: ((n.note % 12) + 12) % 12,
      velocity: 90,
      time: n.note * 0.01,
      duration: 0.5,
      trackIndex: n.trackIndex,
    })),
    tracks,
  };
}

const twoTracks: ParsedMidiTrack[] = [
  { index: 0, name: "Left Hand" },
  { index: 1, name: "Right Hand" },
];

const assignment: HandAssignment = { leftTrack: 0, rightTrack: 1 };

const parsed = makeParsed(
  [
    { note: 48, trackIndex: 0 },
    { note: 72, trackIndex: 1 },
  ],
  twoTracks
);

describe("notesFromParsedMidi hand filter", () => {
  it("left and right yield disjoint expected pitches", () => {
    const left = notesFromParsedMidi(
      parsed,
      { ...pieceLibraryDefaultConfig, handFilter: "left" },
      assignment
    );
    const right = notesFromParsedMidi(
      parsed,
      { ...pieceLibraryDefaultConfig, handFilter: "right" },
      assignment
    );
    expect(new Set(left.flatMap((n) => n.midi))).toEqual(new Set([48]));
    expect(new Set(right.flatMap((n) => n.midi))).toEqual(new Set([72]));
  });

  it("annotates matching notes with hand", () => {
    const left = notesFromParsedMidi(
      parsed,
      { ...pieceLibraryDefaultConfig, handFilter: "left" },
      assignment
    );
    expect(left.every((n) => n.hand === "left")).toBe(true);
  });

  it("both preserves all pitches", () => {
    const notes = notesFromParsedMidi(parsed, pieceLibraryDefaultConfig, assignment);
    expect(new Set(notes.flatMap((n) => n.midi))).toEqual(new Set([48, 72]));
  });

  it("one-hand filter with no assignment produces empty output", () => {
    const notes = notesFromParsedMidi(
      parsed,
      { ...pieceLibraryDefaultConfig, handFilter: "left" },
      { leftTrack: null, rightTrack: null }
    );
    expect(notes).toEqual([]);
  });

  it("both with no assignment still produces all notes", () => {
    const notes = notesFromParsedMidi(
      parsed,
      pieceLibraryDefaultConfig,
      { leftTrack: null, rightTrack: null }
    );
    expect(notes).toHaveLength(2);
  });

  it("transposition does not change track membership", () => {
    const notes = notesFromParsedMidi(
      parsed,
      { ...pieceLibraryDefaultConfig, transpose: 5, handFilter: "left" },
      assignment
    );
    expect(new Set(notes.flatMap((n) => n.midi))).toEqual(new Set([53]));
    expect(notes.every((n) => n.hand === "left")).toBe(true);
  });

  it("legacy ParsedMidi without track metadata is not filtered out for both", () => {
    const legacy: ParsedMidi = {
      kind: "midi",
      duration: 2,
      notes: [
        { note: 60, pc: 0, velocity: 90, time: 0, duration: 0.5 },
        { note: 67, pc: 7, velocity: 90, time: 0.5, duration: 0.25 },
      ],
    };
    const notes = notesFromParsedMidi(legacy, pieceLibraryDefaultConfig, assignment);
    expect(notes).toHaveLength(2);
    expect(notes.every((n) => n.hand === undefined)).toBe(true);
  });

  it("legacy ParsedMidi filtered to one hand yields empty output", () => {
    const legacy: ParsedMidi = {
      kind: "midi",
      duration: 2,
      notes: [{ note: 60, pc: 0, velocity: 90, time: 0, duration: 0.5 }],
    };
    const notes = notesFromParsedMidi(
      legacy,
      { ...pieceLibraryDefaultConfig, handFilter: "left" },
      assignment
    );
    expect(notes).toEqual([]);
  });

  it("rejects conflicting assignment where one track is both hands", () => {
    const conflict: HandAssignment = { leftTrack: 0, rightTrack: 0 };
    expect(() =>
      notesFromParsedMidi(parsed, pieceLibraryDefaultConfig, conflict)
    ).toThrow(/same track/);
  });

  it("covers empty tracks: notes in empty tracks simply do not exist", () => {
    const withEmpty: ParsedMidiTrack[] = [
      { index: 0 },
      { index: 1, name: "Melody" },
      { index: 2 },
    ];
    const p = makeParsed(
      [
        { note: 50, trackIndex: 0 },
        { note: 74, trackIndex: 1 },
      ],
      withEmpty
    );
    const notes = notesFromParsedMidi(
      p,
      { ...pieceLibraryDefaultConfig, handFilter: "right" },
      { leftTrack: 2, rightTrack: 1 }
    );
    expect(new Set(notes.flatMap((n) => n.midi))).toEqual(new Set([74]));
  });

  it("covers a single-track file assigned to one hand", () => {
    const single = makeParsed([{ note: 60, trackIndex: 0 }], [{ index: 0, name: "Only" }]);
    const notes = notesFromParsedMidi(
      single,
      { ...pieceLibraryDefaultConfig, handFilter: "left" },
      { leftTrack: 0, rightTrack: null }
    );
    expect(new Set(notes.flatMap((n) => n.midi))).toEqual(new Set([60]));
  });
});
