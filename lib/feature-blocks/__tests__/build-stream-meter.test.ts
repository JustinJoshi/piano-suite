import { describe, it, expect } from "vitest";
import { buildStream } from "../build-stream";
import type { PracticeNote } from "@/lib/practice-note";

function block(type: string, config: unknown = {}) {
  return { id: `id-${type}`, type, config };
}

function piece(symbols: string[], onsets: number[]): PracticeNote[] {
  return symbols.map((symbol, i) => ({
    midi: [60],
    pcs: new Set([0]),
    symbol,
    onsetMs: onsets[i],
  }));
}

describe("buildStream meter threading", () => {
  const runtimeNotes = (bars: PracticeNote[]) =>
    new Map([["id-pieceLibrary", bars]]);

  const loopBlocks = (repeats = 1) => [
    block("pieceLibrary"),
    {
      id: "id-sectionLoop",
      type: "sectionLoop",
      config: { startBar: 1, endBar: 2, repeats },
    },
  ];

  it("section loop selects three-beat bars at meter 3", () => {
    // 60bpm, 3/4 → one bar = 3000ms. Bars sit at 0, 3000, 6000, 9000.
    const bars = piece(["b0", "b1", "b2", "b3"], [0, 3000, 6000, 9000]);

    const stream = buildStream(
      loopBlocks(),
      60,
      runtimeNotes(bars),
      3
    );

    // Bar [1, 2) covers 3000ms through <6000ms: only b1, rebased to 0.
    expect(stream.map((n) => n.symbol)).toEqual(["b1"]);
    expect(stream.map((n) => n.onsetMs)).toEqual([0]);
  });

  it("section loop still selects four-beat bars by default", () => {
    // 60bpm, default 4/4 → one bar = 4000ms. Bars at 0, 4000, 8000, 12000.
    const bars = piece(["b0", "b1", "b2", "b3"], [0, 4000, 8000, 12000]);

    const stream = buildStream(loopBlocks(), 60, runtimeNotes(bars));

    // Bar [1, 2) covers 4000ms through <8000ms: only b1, rebased to 0.
    expect(stream.map((n) => n.symbol)).toEqual(["b1"]);
    expect(stream.map((n) => n.onsetMs)).toEqual([0]);
  });

  it("section loop repeats span the three-beat bar length", () => {
    const bars = piece(["b0", "b1", "b2"], [0, 3000, 6000]);

    const stream = buildStream(loopBlocks(2), 60, runtimeNotes(bars), 3);

    expect(stream.map((n) => n.symbol)).toEqual(["b1", "b1"]);
    expect(stream.map((n) => n.onsetMs)).toEqual([0, 3000]);
  });

  // Five chords against one onset per bar: the 4th and 5th notes wrap to
  // the next cycle, which is where the meter decides the wrap point.
  const chords = "Cmaj7, Dm7, G7, Am7, Em7";
  const sparsePattern = {
    // One onset on beat 1 of each bar; left hand only.
    leftPattern: "1000000000000000",
    rightPattern: "",
    barsPerCycle: 1,
  };

  it("rhythm pattern wraps sparse grids on three-beat bars", () => {
    const blocks = [
      block("chordLibrary", { chords }),
      block("rhythmPattern", sparsePattern),
    ];

    const stream = buildStream(blocks, 60, undefined, 3);

    expect(stream).toHaveLength(5);
    // 60bpm, meter 3 → one bar = 3000ms. Notes 4 and 5 wrap onto the
    // second and third three-beat cycles (9000ms is a bar boundary the
    // four-beat grid never lands on).
    expect(stream.map((n) => n.onsetMs)).toEqual([
      0, 3000, 6000, 9000, 12000,
    ]);
  });

  it("changing the meter changes composed output without changing bpm", () => {
    const blocks = [
      block("chordLibrary", { chords }),
      block("rhythmPattern", sparsePattern),
    ];

    const inThree = buildStream(blocks, 60, undefined, 3).map(
      (n) => n.onsetMs
    );
    const inFour = buildStream(blocks, 60, undefined, 4).map(
      (n) => n.onsetMs
    );

    expect(inThree).toEqual([0, 3000, 6000, 9000, 12000]);
    expect(inFour).toEqual([0, 4000, 8000, 12000, 16000]);
  });
});
