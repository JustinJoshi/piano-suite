import { describe, it, expect } from "vitest";
import { transform } from "../transform";
import { barWindows, barCount } from "../../../midi-musical-time";
import type { PracticeNote, SourceTiming } from "../../../practice-note";

const PPQ = 480;
const QUARTER = PPQ;
const BAR_44 = PPQ * 4;

function timing(totalTicks: number, ppq = PPQ): SourceTiming {
  return { ppq, totalTicks, tempos: [{ tick: 0, bpm: 120 }], meters: [] };
}

function testNote(partial: Partial<PracticeNote>): PracticeNote {
  return {
    midi: [60],
    pcs: new Set([0]),
    symbol: "n",
    ...partial,
  };
}

describe("sectionLoop musical time", () => {
  it("reads the shared piece-wide timing object from one note", () => {
    const sourceTiming = timing(BAR_44 * 8);
    const notes = Array.from({ length: 8 }, (_, bar) =>
      testNote({
        symbol: `b${bar}`,
        onsetMs: bar * 2000,
        durationMs: 500,
        source: {
          tick: bar * BAR_44,
          durationTicks: QUARTER,
          bar,
          beat: 0,
          timing: sourceTiming,
        },
      })
    );

    expect(barCount(sourceTiming)).toBe(8);

    const at120 = transform(notes, { startBar: 0, endBar: 4, repeats: 1 }, 120, 4);
    const at60 = transform(notes, { startBar: 0, endBar: 4, repeats: 1 }, 60, 4);

    expect(at120.map((n) => n.symbol)).toEqual(["b0", "b1", "b2", "b3"]);
    expect(at60.map((n) => n.symbol)).toEqual(at120.map((n) => n.symbol));
  });

  it("retimes bar-start onsets and durations from source beats", () => {
    const sourceTiming = timing(BAR_44 * 8);
    const notes = Array.from({ length: 8 }, (_, bar) =>
      testNote({
        symbol: `b${bar}`,
        onsetMs: bar * 2000,
        durationMs: 500,
        source: {
          tick: bar * BAR_44,
          durationTicks: QUARTER,
          bar,
          beat: 0,
          timing: sourceTiming,
        },
      })
    );

    const output = transform(notes, { startBar: 0, endBar: 4, repeats: 1 }, 60, 4);

    // 60 BPM 4/4: one bar = 4000ms; a one-beat note = 1000ms (doubled from 500).
    expect(output.map((n) => n.onsetMs)).toEqual([0, 4000, 8000, 12000]);
    expect(output.map((n) => n.durationMs)).toEqual([1000, 1000, 1000, 1000]);
  });

  it("scales durations of short notes fractionally at slower practice tempo", () => {
    const sourceTiming = timing(BAR_44 * 2);
    const notes = [
      testNote({
        symbol: "a",
        onsetMs: 250,
        durationMs: 250,
        source: {
          tick: 240,
          durationTicks: QUARTER / 2, // eighth note
          bar: 0,
          beat: 0.5,
          timing: sourceTiming,
        },
      }),
    ];

    const output = transform(notes, { startBar: 0, endBar: 1, repeats: 1 }, 60, 4);
    // An eighth at 60 BPM lasts 500ms; beat 0.5 sits 500ms into the bar.
    expect(output[0].onsetMs).toBe(500);
    expect(output[0].durationMs).toBe(500);
  });

  it("selects empty bars from the piece's meter map, not note onsets", () => {
    // Notes only in bars 0 and 3; selecting bars [1, 3) must be empty and
    // selecting [3, 4) still lands bar 3 exactly without grace computing.
    const sourceTiming = timing(BAR_44 * 4);
    const noteInBar = (bar: number, symbol: string) =>
      testNote({
        symbol,
        onsetMs: bar * 2000,
        source: {
          tick: bar * BAR_44,
          durationTicks: QUARTER,
          bar,
          beat: 0,
          timing: sourceTiming,
        },
      });
    const notes = [noteInBar(0, "a"), noteInBar(3, "d")];

    expect(transform(notes, { startBar: 1, endBar: 3, repeats: 1 }, 120, 4)).toEqual([]);
    const tail = transform(notes, { startBar: 3, endBar: 4, repeats: 1 }, 120, 4);
    expect(tail.map((n) => n.symbol)).toEqual(["d"]);
    expect(tail[0].onsetMs).toBe(0);
  });

  it("computes correct window lengths across meter changes", () => {
    // Two 4/4 bars then two 3/4 bars; selecting [2, 4) spans 6 beats.
    const sourceTiming: SourceTiming = {
      ppq: PPQ,
      totalTicks: BAR_44 * 2 + PPQ * 3 * 2,
      tempos: [{ tick: 0, bpm: 120 }],
      meters: [
        { tick: 0, numerator: 4, denominator: 4 },
        { tick: BAR_44 * 2, numerator: 3, denominator: 4 },
      ],
    };
    expect(barWindows(sourceTiming).slice(2).map((w) => w.beats)).toEqual([3, 3]);

    const note = testNote({
      symbol: "c",
      onsetMs: 4000,
      source: {
        tick: BAR_44 * 2,
        durationTicks: QUARTER,
        bar: 2,
        beat: 0,
        timing: sourceTiming,
      },
    });

    const at120 = transform([note], { startBar: 2, endBar: 4, repeats: 2 }, 120, 4);
    expect(at120.map((n) => n.onsetMs)).toEqual([0, 3000]);
    expect(barWindows(sourceTiming)[2].numerator).toBe(3);
  });

  it("keeps the legacy onsetMs path byte-identical for time-only streams", () => {
    const notes = [
      testNote({ symbol: "a", onsetMs: 2000 }),
      testNote({ symbol: "b", onsetMs: 6000 }),
      testNote({ symbol: "c", onsetMs: 20000 }),
    ];

    // 120 BPM 4/4: one bar = 2000ms. Legacy selects [2000, 8000): a and b.
    const output = transform(notes, { startBar: 1, endBar: 4, repeats: 2 }, 120, 4);
    expect(output.map((n) => n.symbol)).toEqual(["a", "b", "a", "b"]);
    expect(output.map((n) => n.onsetMs)).toEqual([0, 4000, 6000, 10000]);
  });

  it("does not mutate the input array or the frozen timing object", () => {
    const sourceTiming = Object.freeze(timing(BAR_44 * 4));
    const notes = [
      testNote({
        symbol: "a",
        onsetMs: 0,
        durationMs: 500,
        source: {
          tick: 0,
          durationTicks: QUARTER,
          bar: 0,
          beat: 0,
          timing: sourceTiming,
        },
      }),
      testNote({ symbol: "b", onsetMs: 4000, durationMs: 500 }),
    ];
    const snapshot = notes.map((n) => ({ ...n, source: n.source ? { ...n.source } : undefined }));
    const before = sourceTiming.totalTicks;

    transform(notes, { startBar: 0, endBar: 2, repeats: 2 }, 120, 4);

    expect(before).toBe(sourceTiming.totalTicks);
    expect(Object.isFrozen(sourceTiming)).toBe(true);
    expect(notes[0]).toEqual(snapshot[0]);
    expect(notes[1]).toEqual(snapshot[1]);
  });
});
