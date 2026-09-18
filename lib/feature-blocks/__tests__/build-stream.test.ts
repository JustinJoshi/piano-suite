import { describe, it, expect } from "vitest";
import { buildStream, composeSources, applyTransforms } from "../build-stream";
import type { PracticeNote } from "@/lib/practice-note";

function block(type: string, config: unknown = {}) {
  return { id: `id-${type}`, type, config };
}

function note(symbol: string): PracticeNote {
  return { midi: [60], pcs: new Set([0]), symbol };
}

describe("buildStream", () => {
  it("concatenates source outputs in page order", () => {
    const stream = buildStream([
      block("chordLibrary", { chords: "Cmaj7" }),
      block("scaleLibrary"),
    ]);

    // Default scale config is a C major octave up and down (15 notes) and
    // the chord library contributes Cmaj7 first.
    expect(stream).toHaveLength(16);
    expect(stream[0].symbol).toBe("Cmaj7");
    expect(stream[1].symbol).toBe("C");
  });

  it("returns [] when the page has no source", () => {
    expect(buildStream([block("rhythmPattern")])).toEqual([]);
    expect(buildStream([block("metronome"), block("targetDisplay")])).toEqual(
      []
    );
  });

  it("applies the rhythm transform to the accumulated source notes", () => {
    // Defaults: "1000"/"0100" on a 1-bar grid at 120bpm — onsets a 16th
    // apart (0ms and 125ms), duration 500ms.
    const stream = buildStream([
      block("chordLibrary", { chords: "Cmaj7, Dm7, G7" }),
      block("rhythmPattern"),
    ]);

    expect(stream).toHaveLength(3);
    for (const note of stream) {
      expect(note.onsetMs).toBeDefined();
      expect(note.durationMs).toBe(500);
    }
    expect(stream[0].onsetMs).toBe(0);
    expect(stream[1].onsetMs).toBe(125);
  });

  it("leaves source notes without onsets when no transform follows", () => {
    const stream = buildStream([block("chordLibrary", { chords: "Cmaj7" })]);

    expect(stream).toHaveLength(1);
    expect(stream[0].onsetMs).toBeUndefined();
  });

  it("honors a transport bpm when timing the transform", () => {
    const stream = buildStream(
      [
        block("chordLibrary", { chords: "Cmaj7, Dm7" }),
        block("rhythmPattern"),
      ],
      60
    );

    // At 60bpm the second 16th of the grid lands at 250ms.
    expect(stream[1].onsetMs).toBe(250);
  });

  it("skips a source whose manifest kind disagrees", () => {
    // chordLibrary keyed as a source; a type in the source map would be
    // ignored if its manifest stopped saying "source".
    const stream = buildStream([block("chordLibrary", { chords: "Cmaj7" })]);
    expect(stream).toHaveLength(1);
  });
});

describe("runtime source channel", () => {
  it("replaces a runtime block's config generation with the registered notes", () => {
    const blocks = [block("pieceLibrary")];
    const runtimeNotes = new Map([["id-pieceLibrary", [note("C4"), note("E4")]]]);

    // No entry: a runtime-contributed block with nothing registered
    // contributes nothing, exactly as today.
    expect(buildStream(blocks, 120, new Map())).toEqual([]);

    const stream = buildStream(blocks, 120, runtimeNotes);
    expect(stream.map((n) => n.symbol)).toEqual(["C4", "E4"]);
  });

  it("preserves page order across config and runtime sources", () => {
    const blocks = [
      block("chordLibrary", { chords: "Cmaj7" }),
      block("pieceLibrary"),
      block("scaleLibrary"),
    ];
    const runtimeNotes = new Map([["id-pieceLibrary", [note("C4")]]]);

    // Default scale config contributes 15 notes (C octave up and down).
    const stream = buildStream(blocks, 120, runtimeNotes);
    expect(stream).toHaveLength(17);
    expect(stream[0].symbol).toBe("Cmaj7");
    expect(stream[1].symbol).toBe("C4");
    expect(stream[2].symbol).toBe("C");
  });

  it("still applies transforms after the runtime merge", () => {
    const blocks = [
      block("pieceLibrary"),
      block("rhythmPattern"),
    ];
    const runtimeNotes = new Map([
      ["id-pieceLibrary", [note("C4"), note("D4")]],
    ]);

    const stream = buildStream(blocks, 120, runtimeNotes);
    expect(stream).toHaveLength(2);
    for (const n of stream) {
      expect(n.onsetMs).toBeDefined();
      expect(n.durationMs).toBe(500);
    }
    expect(stream[0].onsetMs).toBe(0);
    expect(stream[1].onsetMs).toBe(125);
  });

  it("behaves identically to today when the runtime map is absent", () => {
    const blocks = [block("chordLibrary", { chords: "Cmaj7" })];
    expect(buildStream(blocks)).toEqual(buildStream(blocks, 120, new Map()));
  });

  it("sectionLoop over a pieceLibrary runtime source returns only the looped window", () => {
    // Bars 0, 1, 2 at 120bpm 4/4 = 0ms, 2000ms, 4000ms. The loop keeps bar 1
    // only ([2000, 4000)) and plays it twice, rebased so it starts at 0.
    const piece: PracticeNote[] = [
      { midi: [60], pcs: new Set([0]), symbol: "bar0", onsetMs: 0 },
      { midi: [62], pcs: new Set([2]), symbol: "bar1", onsetMs: 2000 },
      { midi: [64], pcs: new Set([4]), symbol: "bar2", onsetMs: 4000 },
    ];
    const blocks = [
      block("pieceLibrary"),
      { id: "id-sectionLoop", type: "sectionLoop", config: { startBar: 1, endBar: 2, repeats: 2 } },
    ];
    const runtimeNotes = new Map([["id-pieceLibrary", piece]]);

    const stream = buildStream(blocks, 120, runtimeNotes);
    expect(stream.map((n) => n.symbol)).toEqual(["bar1", "bar1"]);
    expect(stream.map((n) => n.onsetMs)).toEqual([0, 2000]);
  });

  it("keeps composeSources and applyTransforms composable", () => {
    const blocks = [
      block("pieceLibrary"),
      block("rhythmPattern"),
    ];
    const runtimeNotes = new Map([["id-pieceLibrary", [note("C4")]]]);

    const composed = composeSources(blocks, runtimeNotes);
    expect(composed.map((n) => n.symbol)).toEqual(["C4"]);

    const transformed = applyTransforms(composed, blocks, 120);
    expect(transformed[0].onsetMs).toBe(0);
  });
});
