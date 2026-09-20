import { describe, it, expect } from "vitest";
import { parseMidiFile } from "@/lib/music-player";
import { notesFromParsedMidi } from "@/lib/feature-blocks/piece-library/adapt";
import { normalizePieceLibraryConfig } from "@/lib/feature-blocks/piece-library/config";
import { buildStream } from "../build-stream";
import type { StreamBlock } from "../build-stream";
import type { PracticeNote } from "@/lib/practice-note";

const PPQ = 480;
const QUARTER = PPQ;
const BAR_44 = QUARTER * 4;
const BAR_34 = QUARTER * 3;

// --- Minimal MIDI byte builders (same technique as the phase-1 tests) ------

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
  return chunk("MTrk", [...payload, 0x00, 0xff, 0x2f, 0x00]);
}

function midiFile(ppq: number, trackPayload: number[]): ArrayBuffer {
  const header = chunk("MThd", [0, 0, 0, 1, ppq >> 8, ppq & 0xff]);
  return new Uint8Array([...header, ...trackPayload]).buffer;
}

const NOTE_ON = (note: number, vel = 100): number[] => [0x90, note, vel];
const NOTE_OFF = (note: number): number[] => [0x80, note, 0];

const TEMPO_EVENT = (bpm: number): number[] => [
  0xff, 0x51, 0x03,
  Math.floor(60_000_000 / bpm) >> 16,
  (Math.floor(60_000_000 / bpm) >> 8) & 0xff,
  Math.floor(60_000_000 / bpm) & 0xff,
];

const TIME_SIGNATURE_EVENT = (n: number, d: number): number[] => [
  0xff, 0x58, 0x04, n, Math.round(Math.log2(d)), 24, 8,
];

/**
 * A quarter note on beat 1 of each bar. The tail delta stretches the track
 * to the end of the final bar so `totalTicks` covers every boundary.
 */
function barClockworkFixture(pitches: number[], barTicks: number, header: TrackEvent[] = []): ArrayBuffer {
  const events: TrackEvent[] = [...header];
  pitches.forEach((note, bar) => {
    events.push({ delta: bar === 0 ? 0 : barTicks - QUARTER, bytes: NOTE_ON(note) });
    events.push({ delta: QUARTER, bytes: NOTE_OFF(note) });
  });
  // After the last note-off, silence reaches the final bar line: the notes
  // used (pitches.length - 1) whole bars plus one quarter, the piece spans
  // pitches.length * barTicks.
  events.push({ delta: Math.max(0, barTicks - pitches.length * QUARTER), bytes: [] });
  return midiFile(PPQ, track(events));
}

// ---

function runtimeNotesMap(notes: PracticeNote[]) {
  return new Map([["id-pieceLibrary", notes]]);
}

const loopBlocks = (blocks: StreamBlock[]) => blocks;

const defaults = normalizePieceLibraryConfig({});

describe("sectionLoop source-bar selection through buildStream", () => {
  it("selects the same first four bar-start pitches at 120 and 60 BPM", () => {
    const parsed = parseMidiFile(
      barClockworkFixture([60, 61, 62, 63, 64, 65, 66, 67], BAR_44, [
        { delta: 0, bytes: TEMPO_EVENT(120) },
      ])
    );
    const notes = notesFromParsedMidi(parsed, defaults);

    const blocks = loopBlocks([
      { id: "id-pieceLibrary", type: "pieceLibrary", config: {} },
      { id: "id-loop", type: "sectionLoop", config: { startBar: 0, endBar: 4, repeats: 1 } },
    ]);
    const at120 = buildStream(blocks, 120, runtimeNotesMap(notes));
    const at60 = buildStream(blocks, 60, runtimeNotesMap(notes));

    const pitches = (stream: PracticeNote[]) => stream.map((n) => n.midi[0]);
    expect(pitches(at120)).toEqual([60, 61, 62, 63]);
    expect(pitches(at60)).toEqual(pitches(at120));
    // 60 BPM: bar = 4000ms, quarter note = 1000ms (doubled from 500ms).
    expect(at60.map((n) => n.onsetMs)).toEqual([0, 4000, 8000, 12000]);
    expect(at60.map((n) => n.durationMs)).toEqual([1000, 1000, 1000, 1000]);
  });

  it("keeps a 3/4 fixture's selected bars across practice tempos", () => {
    const parsed = parseMidiFile(
      barClockworkFixture([60, 62, 64, 65], BAR_34, [
        { delta: 0, bytes: TEMPO_EVENT(120) },
        { delta: 0, bytes: TIME_SIGNATURE_EVENT(3, 4) },
      ])
    );
    const notes = notesFromParsedMidi(parsed, defaults);

    const blocks = loopBlocks([
      { id: "id-pieceLibrary", type: "pieceLibrary", config: {} },
      { id: "id-loop", type: "sectionLoop", config: { startBar: 1, endBar: 4, repeats: 1 } },
    ]);
    const at120 = buildStream(blocks, 120, runtimeNotesMap(notes));
    const at60 = buildStream(blocks, 60, runtimeNotesMap(notes));

    expect(at120.map((n) => n.midi[0])).toEqual([62, 64, 65]);
    expect(at60.map((n) => n.midi[0])).toEqual([62, 64, 65]);
    // 60 BPM, 3/4: bars at 0/3000/6000; each quarter note = 1000ms.
    expect(at60.map((n) => n.onsetMs)).toEqual([0, 3000, 6000]);
    expect(at60.map((n) => n.durationMs)).toEqual([1000, 1000, 1000]);
  });

  it("retains selected bars when the source has a tempo change", () => {
    // Six 4/4 bars; the source tempo changes from 90 to 150 BPM right after
    // bar 2's first beat, inside the selected piece but irrelevant to it.
    const events: TrackEvent[] = [
      { delta: 0, bytes: TEMPO_EVENT(90) },
      { delta: 0, bytes: NOTE_ON(60) },
      { delta: QUARTER, bytes: NOTE_OFF(60) },
      { delta: BAR_44 - QUARTER, bytes: NOTE_ON(62) },
      { delta: QUARTER, bytes: NOTE_OFF(62) },
      { delta: BAR_44 - QUARTER, bytes: NOTE_ON(64) },
      { delta: QUARTER, bytes: NOTE_OFF(64) },
      { delta: 0, bytes: TEMPO_EVENT(150) },
      { delta: BAR_44 - QUARTER, bytes: NOTE_ON(65) },
      { delta: QUARTER, bytes: NOTE_OFF(65) },
      { delta: BAR_44 - QUARTER, bytes: NOTE_ON(67) },
      { delta: QUARTER, bytes: NOTE_OFF(67) },
      { delta: BAR_44 - QUARTER, bytes: NOTE_ON(69) },
      { delta: QUARTER, bytes: NOTE_OFF(69) },
      { delta: BAR_44 - QUARTER, bytes: [] },
    ];
    const parsed = parseMidiFile(midiFile(PPQ, track(events)));
    const notes = notesFromParsedMidi(parsed, defaults);

    const blocks = loopBlocks([
      { id: "id-pieceLibrary", type: "pieceLibrary", config: {} },
      { id: "id-loop", type: "sectionLoop", config: { startBar: 0, endBar: 4, repeats: 1 } },
    ]);
    const at90 = buildStream(blocks, 90, runtimeNotesMap(notes));
    const at60 = buildStream(blocks, 60, runtimeNotesMap(notes));

    expect(at90.map((n) => n.midi[0])).toEqual([60, 62, 64, 65]);
    expect(at60.map((n) => n.midi[0])).toEqual([60, 62, 64, 65]);
  });

  it("covers a meter change with exact window lengths", () => {
    // Two 4/4 bars, then two 3/4 bars: a note on every bar start.
    const events: TrackEvent[] = [
      { delta: 0, bytes: TEMPO_EVENT(120) },
      { delta: 0, bytes: TIME_SIGNATURE_EVENT(4, 4) },
      { delta: 0, bytes: NOTE_ON(60) },
      { delta: QUARTER, bytes: NOTE_OFF(60) },
      { delta: BAR_44 - QUARTER, bytes: NOTE_ON(62) },
      { delta: QUARTER, bytes: NOTE_OFF(62) },
      { delta: BAR_44 - QUARTER, bytes: TIME_SIGNATURE_EVENT(3, 4) },
      { delta: 0, bytes: NOTE_ON(64) },
      { delta: QUARTER, bytes: NOTE_OFF(64) },
      { delta: BAR_34 - QUARTER, bytes: NOTE_ON(65) },
      { delta: QUARTER, bytes: NOTE_OFF(65) },
      { delta: BAR_34 - QUARTER, bytes: [] },
    ];
    const parsed = parseMidiFile(midiFile(PPQ, track(events)));
    const notes = notesFromParsedMidi(parsed, defaults);

    // Bars [2, 4) span exactly two 3/4 bars = 6 beats; two repeats.
    const blocks = loopBlocks([
      { id: "id-pieceLibrary", type: "pieceLibrary", config: {} },
      { id: "id-loop", type: "sectionLoop", config: { startBar: 2, endBar: 4, repeats: 2 } },
    ]);
    const at120 = buildStream(blocks, 120, runtimeNotesMap(notes));
    expect(at120.map((n) => n.midi[0])).toEqual([64, 65, 64, 65]);
    expect(at120.map((n) => n.onsetMs)).toEqual([0, 1500, 3000, 4500]);

    const at60 = buildStream(blocks, 60, runtimeNotesMap(notes));
    expect(at60.map((n) => n.midi[0])).toEqual([64, 65, 64, 65]);
    expect(at60.map((n) => n.onsetMs)).toEqual([0, 3000, 6000, 9000]);
  });

  it("returns an empty section for a bar window with no notes", () => {
    // Notes only in bars 0 and 3 of a five-bar 4/4 piece.
    const events: TrackEvent[] = [
      { delta: 0, bytes: TEMPO_EVENT(120) },
      { delta: 0, bytes: NOTE_ON(60) },
      { delta: QUARTER, bytes: NOTE_OFF(60) },
      { delta: BAR_44 * 3 - QUARTER, bytes: NOTE_ON(67) },
      { delta: QUARTER, bytes: NOTE_OFF(67) },
      { delta: BAR_44 - QUARTER, bytes: [] },
    ];
    const parsed = parseMidiFile(midiFile(PPQ, track(events)));
    const notes = notesFromParsedMidi(parsed, defaults);

    const blocks = loopBlocks([
      { id: "id-pieceLibrary", type: "pieceLibrary", config: {} },
      { id: "id-loop", type: "sectionLoop", config: { startBar: 1, endBar: 3, repeats: 1 } },
    ]);
    const stream = buildStream(blocks, 120, runtimeNotesMap(notes));
    expect(stream).toEqual([]);
  });

  it("keeps metadata consistent through a composed second sectionLoop", () => {
    const parsed = parseMidiFile(
      barClockworkFixture([60, 61, 62, 63, 64, 65, 66, 67], BAR_44, [
        { delta: 0, bytes: TEMPO_EVENT(120) },
      ])
    );
    const notes = notesFromParsedMidi(parsed, defaults);

    const blocks = loopBlocks([
      { id: "id-pieceLibrary", type: "pieceLibrary", config: {} },
      { id: "id-loop-1", type: "sectionLoop", config: { startBar: 0, endBar: 4, repeats: 1 } },
      { id: "id-loop-2", type: "sectionLoop", config: { startBar: 0, endBar: 2, repeats: 2 } },
    ]);

    // The second loop still selects in original source bars, so bars [0, 2)
    // of the piece play twice at the practice tempo.
    const stream = buildStream(blocks, 120, runtimeNotesMap(notes));
    expect(stream.map((n) => n.midi[0])).toEqual([60, 61, 60, 61]);
    expect(stream.map((n) => n.onsetMs)).toEqual([0, 2000, 4000, 6000]);
  });
});

describe("input immutability through buildStream", () => {
  it("does not mutate source notes, their onsets or the timing object", () => {
    const parsed = parseMidiFile(
      barClockworkFixture([60, 61, 62, 63, 64, 65, 66, 67], BAR_44, [
        { delta: 0, bytes: TEMPO_EVENT(120) },
      ])
    );
    const notes = notesFromParsedMidi(parsed, defaults);
    const frozen = notes[0].source!.timing;
    const snapshots = notes.map((n) => ({
      onsetMs: n.onsetMs,
      durationMs: n.durationMs,
      tick: n.source?.tick,
      bar: n.source?.bar,
      timingRef: n.source?.timing,
    }));

    buildStream(
      loopBlocks([
        { id: "id-pieceLibrary", type: "pieceLibrary", config: {} },
        { id: "id-loop", type: "sectionLoop", config: { startBar: 0, endBar: 4, repeats: 2 } },
      ]),
      60,
      runtimeNotesMap(notes)
    );

    expect(snapshots).toEqual(
      notes.map((n) => ({
        onsetMs: n.onsetMs,
        durationMs: n.durationMs,
        tick: n.source?.tick,
        bar: n.source?.bar,
        timingRef: n.source?.timing,
      }))
    );
    expect(Object.isFrozen(frozen)).toBe(true);
  });

  it("runs the legacy onsetMs path for time-only streams with no metadata", () => {
    const bars = [0, 1, 2, 3, 4, 5, 6, 7].map((bar) => ({
      midi: [60 + bar],
      pcs: new Set([0]),
      symbol: `b${bar}`,
      onsetMs: bar * 2000, // 120 BPM, 4/4
      durationMs: 500,
    }));

    const blocks = loopBlocks([
      { id: "id-pieceLibrary", type: "pieceLibrary", config: {} },
      { id: "id-loop", type: "sectionLoop", config: { startBar: 0, endBar: 4, repeats: 1 } },
    ]);
    const stream = buildStream(blocks, 120, runtimeNotesMap(bars));
    expect(stream.map((n) => n.symbol)).toEqual(["b0", "b1", "b2", "b3"]);
    expect(stream.map((n) => n.onsetMs)).toEqual([0, 2000, 4000, 6000]);
  });
});
