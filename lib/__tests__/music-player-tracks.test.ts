import { describe, it, expect } from "vitest";
import { parseMidiFile } from "@/lib/music-player";
import { Midi } from "@tonejs/midi";

function twoTrackArrayBuffer(): ArrayBuffer {
  const midi = new Midi();
  const left = midi.addTrack();
  left.name = "Left Hand";
  left.addNote({ midi: 48, time: 0, duration: 1, velocity: 0.8 });
  const right = midi.addTrack();
  right.name = "Right Hand";
  right.addNote({ midi: 72, time: 0, duration: 1, velocity: 0.9 });
  midi.addTrack(); // empty track in the middle keeps its index
  const tail = midi.addTrack();
  tail.name = "Extras";
  return midi.toArray().buffer as ArrayBuffer;
}

function singleTrackArrayBuffer(): ArrayBuffer {
  const midi = new Midi();
  const track = midi.addTrack();
  track.name = "Only";
  track.addNote({ midi: 60, time: 0.5, duration: 0.25, velocity: 0.7 });
  return midi.toArray().buffer as ArrayBuffer;
}

describe("parseMidiFile track identity", () => {
  it("retains original track indices, names, and empty tracks", () => {
    const parsed = parseMidiFile(twoTrackArrayBuffer());
    expect(parsed.tracks).toEqual([
      { index: 0, name: "Left Hand" },
      { index: 1, name: "Right Hand" },
      { index: 2 },
      { index: 3, name: "Extras" },
    ]);
    const byNote = new Map(parsed.notes.map((n) => [n.note, n]));
    expect(byNote.get(48)?.trackIndex).toBe(0);
    expect(byNote.get(72)?.trackIndex).toBe(1);
  });

  it("preserves playback note order and seconds", () => {
    const parsed = parseMidiFile(singleTrackArrayBuffer());
    // MIDI velocity is 7-bit, so the encode/decode roundtrip may shift it by 1.
    expect(parsed.notes[0]).toMatchObject({
      note: 60,
      pc: 0,
      time: 0.5,
      duration: 0.25,
      trackIndex: 0,
    });
    expect(Math.abs(parsed.notes[0].velocity - Math.round(0.7 * 127))).toBeLessThanOrEqual(1);
    expect(parsed.duration).toBeCloseTo(0.75, 5);
  });

  it("tags every note with its original track index", () => {
    const midi = new Midi();
    midi.addTrack().addNote({ midi: 55, time: 0, duration: 0.1, velocity: 0.5 });
    midi.addTrack();
    midi.addTrack().addNote({ midi: 67, time: 0, duration: 0.1, velocity: 0.5 });
    const parsed = parseMidiFile(midi.toArray().buffer as ArrayBuffer);
    expect(parsed.notes.map((n) => n.trackIndex)).toEqual([0, 2]);
  });
});
