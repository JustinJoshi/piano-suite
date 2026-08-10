import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  detectFileKind,
  dispatchMusicNoteOn,
  dispatchMusicNoteOff,
  frequencyToNote,
  isSupportedMusicFile,
  parseMidiFile,
  scheduleMidiNotes,
} from "@/lib/music-player";

// Minimal valid MIDI file: single track, one note-on / note-off for C4.
function buildMinimalMidi(): ArrayBuffer {
  const bytes = [
    0x4d, 0x54, 0x68, 0x64, // MThd
    0x00, 0x00, 0x00, 0x06, // header length
    0x00, 0x00, // format 0
    0x00, 0x01, // one track
    0x00, 0x60, // 96 ticks per quarter
    0x4d, 0x54, 0x72, 0x6b, // MTrk
    0x00, 0x00, 0x00, 0x0d, // track length 13
    0x00, 0x90, 0x3c, 0x40, // delta 0, note on C4, velocity 64
    0x60, 0x80, 0x3c, 0x40, // delta 96, note off C4
    0x00, 0xff, 0x2f, 0x00, // end of track
  ];
  return new Uint8Array(bytes).buffer;
}

describe("file detection", () => {
  it("detects MIDI files by extension", () => {
    expect(detectFileKind(new File([], "song.mid"))).toBe("midi");
    expect(detectFileKind(new File([], "song.MIDI"))).toBe("midi");
  });

  it("detects audio files as audio", () => {
    expect(detectFileKind(new File([], "song.mp3"))).toBe("audio");
    expect(detectFileKind(new File([], "song.wav"))).toBe("audio");
  });

  it("accepts supported music files", () => {
    expect(isSupportedMusicFile(new File([], "a.mid"))).toBe(true);
    expect(isSupportedMusicFile(new File([], "a.mp3"))).toBe(true);
    expect(isSupportedMusicFile(new File([], "a.txt"))).toBe(false);
  });
});

describe("frequencyToNote", () => {
  it("maps A4 (440Hz) to MIDI 69", () => {
    const result = frequencyToNote(440);
    expect(result).not.toBeNull();
    expect(result!.note).toBe(69);
    expect(result!.pc).toBe(9);
    expect(Math.abs(result!.cents)).toBeLessThanOrEqual(1);
  });

  it("maps C4 to MIDI 60", () => {
    const result = frequencyToNote(261.63);
    expect(result).not.toBeNull();
    expect(result!.note).toBe(60);
    expect(result!.pc).toBe(0);
  });

  it("returns null for invalid frequencies", () => {
    expect(frequencyToNote(0)).toBeNull();
    expect(frequencyToNote(-100)).toBeNull();
    expect(frequencyToNote(NaN)).toBeNull();
  });
});

describe("parseMidiFile", () => {
  it("parses a minimal MIDI file and extracts note events", () => {
    const parsed = parseMidiFile(buildMinimalMidi());
    expect(parsed.kind).toBe("midi");
    expect(parsed.notes).toHaveLength(1);
    expect(parsed.notes[0].note).toBe(60);
    expect(parsed.notes[0].velocity).toBe(64);
    expect(parsed.duration).toBeGreaterThan(0);
  });
});

describe("dispatchMusicNoteOn / dispatchMusicNoteOff", () => {
  let listeners: { on: EventListener; off: EventListener } | null = null;

  beforeEach(() => {
    listeners = {
      on: vi.fn(),
      off: vi.fn(),
    };
    window.addEventListener("music-note-on", listeners.on);
    window.addEventListener("music-note-off", listeners.off);
  });

  afterEach(() => {
    if (listeners) {
      window.removeEventListener("music-note-on", listeners.on);
      window.removeEventListener("music-note-off", listeners.off);
    }
  });

  it("dispatches music-note-on with note, pc, and velocity", () => {
    dispatchMusicNoteOn(60, 100);
    expect(listeners!.on).toHaveBeenCalledTimes(1);
    const event = (listeners!.on as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as CustomEvent;
    expect(event.detail.note).toBe(60);
    expect(event.detail.pc).toBe(0);
    expect(event.detail.velocity).toBe(100);
  });

  it("dispatches music-note-off with zero velocity", () => {
    dispatchMusicNoteOff(60);
    expect(listeners!.off).toHaveBeenCalledTimes(1);
    const event = (listeners!.off as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as CustomEvent;
    expect(event.detail.note).toBe(60);
    expect(event.detail.pc).toBe(0);
    expect(event.detail.velocity).toBe(0);
  });
});

describe("scheduleMidiNotes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispatches note-on and note-off events at scheduled times", () => {
    const onListener = vi.fn();
    const offListener = vi.fn();
    window.addEventListener("music-note-on", onListener);
    window.addEventListener("music-note-off", offListener);

    const notes = [
      { note: 60, pc: 0, velocity: 100, time: 0, duration: 0.1 },
      { note: 64, pc: 4, velocity: 100, time: 0.2, duration: 0.1 },
    ];

    scheduleMidiNotes(notes, 0);

    expect(onListener).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5);
    expect(onListener).toHaveBeenCalledTimes(1);
    expect(onListener.mock.calls[0][0].detail.note).toBe(60);

    vi.advanceTimersByTime(100);
    expect(offListener).toHaveBeenCalledTimes(1);
    expect(offListener.mock.calls[0][0].detail.note).toBe(60);

    vi.advanceTimersByTime(100);
    expect(onListener).toHaveBeenCalledTimes(2);
    expect(onListener.mock.calls[1][0].detail.note).toBe(64);

    window.removeEventListener("music-note-on", onListener);
    window.removeEventListener("music-note-off", offListener);
  });

  it("skips notes before progressMs", () => {
    const onListener = vi.fn();
    window.addEventListener("music-note-on", onListener);

    const notes = [
      { note: 60, pc: 0, velocity: 100, time: 0, duration: 0.5 },
      { note: 64, pc: 4, velocity: 100, time: 1, duration: 0.5 },
    ];

    scheduleMidiNotes(notes, 800);
    expect(onListener).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(onListener).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(onListener).toHaveBeenCalledTimes(1);
    expect(onListener.mock.calls[0][0].detail.note).toBe(64);

    window.removeEventListener("music-note-on", onListener);
  });
});
