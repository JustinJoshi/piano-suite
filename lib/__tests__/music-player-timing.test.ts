import { describe, it, expect } from "vitest";
import { parseMidiFile } from "@/lib/music-player";

const PPQ = 480;

// --- Minimal MIDI byte builders -------------------------------------------

function varint(value: number): number[] {
  const bytes: number[] = [value & 0x7f];
  while (value >= 128) {
    value >>= 7;
    bytes.unshift(0x80 | (value & 0x7f));
  }
  return bytes;
}

function chunk(id: string, payload: number[]): number[] {
  const bytes = [...id].map((c) => c.charCodeAt(0));
  const length = payload.length;
  return [
    ...bytes,
    (length >>> 24) & 0xff,
    (length >> 16) & 0xff,
    (length >> 8) & 0xff,
    length & 0xff,
    ...payload,
  ];
}

type TrackEvent = { delta: number; bytes: number[] };

function track(events: TrackEvent[]): number[] {
  const payload: number[] = [];
  for (const event of events) {
    payload.push(...varint(event.delta), ...event.bytes);
  }
  return chunk("MTrk", [...payload, 0x00, 0xff, 0x2f, 0x00]); // end of track
}

function midiFile(ppq: number, trackPayload: number[]): ArrayBuffer {
  const header = chunk("MThd", [0, 0, 0, 1, ppq >> 8, ppq & 0xff]);
  const bytes = [...header, ...trackPayload];
  return new Uint8Array(bytes).buffer;
}

const NOTE_ON = (note: number, vel = 100): number[] => [
  0x90, note, vel,
];
const NOTE_OFF = (note: number): number[] => [0x80, note, 0];

// Tempo events: FF 51 03 <microseconds per quarter, 3 bytes>.
const TEMPO_EVENT = (bpm: number): number[] => [
  0xff, 0x51, 0x03,
  ((60_000_000 / bpm) >> 16) & 0xff,
  ((60_000_000 / bpm) >> 8) & 0xff,
  (60_000_000 / bpm) & 0xff,
];
// Time signature: FF 58 04 nn dd cc bb (dd is 2^n; common 24, 8).
const TIME_SIGNATURE_EVENT = (n: number, d: number): number[] => {
  const log2 = Math.round(Math.log2(d));
  return [0xff, 0x58, 0x04, n, log2, 24, 8];
};

// One C4 quarter note at 120 BPM from tick 0: time 0s, duration 0.5s.
function oneBarFixture(extraHeaderEvents: TrackEvent[] = []): ArrayBuffer {
  const events = [
    ...extraHeaderEvents,
    { delta: 0, bytes: NOTE_ON(60) },
    { delta: PPQ, bytes: NOTE_OFF(60) },
  ];
  return midiFile(PPQ, track(events));
}

// ---

describe("parseMidiFile timing metadata", () => {
  it("keeps note ticks and durationTicks alongside unchanged seconds", () => {
    const parsed = parseMidiFile(oneBarFixture([
      { delta: 0, bytes: TEMPO_EVENT(120) },
    ]));
    const note = parsed.notes[0];
    expect(note.time).toBe(0);
    expect(note.duration).toBeCloseTo(0.5, 5); // global playback seconds unchanged
    expect(note.ticks).toBe(0);
    expect(note.durationTicks).toBe(PPQ);
  });

  it("carries PPQ, totalTicks and default meter when the file has none", () => {
    const parsed = parseMidiFile(oneBarFixture());
    expect(parsed.timing?.ppq).toBe(PPQ);
    expect(parsed.timing?.totalTicks).toBeGreaterThanOrEqual(PPQ);
    expect(parsed.timing?.meters).toHaveLength(0); // helpers default to 4/4
  });

  it("preserves an explicit 3/4 time signature", () => {
    const parsed = parseMidiFile(oneBarFixture([
      { delta: 0, bytes: TEMPO_EVENT(120) },
      { delta: 0, bytes: TIME_SIGNATURE_EVENT(3, 4) },
    ]));
    expect(parsed.timing?.meters).toEqual([
      { tick: 0, numerator: 3, denominator: 4 },
    ]);
  });

  it("preserves a meter change at a later tick", () => {
    const parsed = parseMidiFile(midiFile(
      PPQ,
      track([
        { delta: 0, bytes: TEMPO_EVENT(120) },
        { delta: 0, bytes: TIME_SIGNATURE_EVENT(4, 4) },
        { delta: 0, bytes: NOTE_ON(60) },
        { delta: PPQ * 4, bytes: NOTE_OFF(60) },
        { delta: 0, bytes: TIME_SIGNATURE_EVENT(3, 4) },
        { delta: 0, bytes: NOTE_ON(64) },
        { delta: PPQ * 3, bytes: NOTE_OFF(64) },
      ])
    ));
    expect(parsed.timing?.meters).toEqual([
      { tick: 0, numerator: 4, denominator: 4 },
      { tick: PPQ * 4, numerator: 3, denominator: 4 },
    ]);
  });

  it("preserves tempo changes at their source ticks", () => {
    const parsed = parseMidiFile(midiFile(
      PPQ,
      track([
        { delta: 0, bytes: TEMPO_EVENT(120) },
        { delta: 0, bytes: NOTE_ON(60) },
        { delta: PPQ * 2, bytes: TEMPO_EVENT(60) },
        { delta: PPQ, bytes: NOTE_OFF(60) },
      ])
    ));
    expect(parsed.timing?.tempos).toEqual([
      { tick: 0, bpm: 120 },
      { tick: PPQ * 2, bpm: 60 },
    ]);
    // Seconds still reflect the tempo ramp through tonejs: 2 quarters at
    // 120 BPM (1.0s) plus one quarter at 60 BPM (1.0s).
    expect(parsed.notes[0].time).toBe(0);
    expect(parsed.notes[0].duration).toBeCloseTo(2, 2);
  });
});
