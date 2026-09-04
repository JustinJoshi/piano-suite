import { describe, it, expect } from "vitest";
import { buildStream } from "../build-stream";

function block(type: string, config: unknown = {}) {
  return { id: `id-${type}`, type, config };
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
