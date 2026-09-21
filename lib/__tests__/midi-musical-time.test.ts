import { describe, it, expect } from "vitest";
import {
  barBeatToTick,
  barCount,
  barWindow,
  barWindows,
  beatSecondsAt,
  tickToBarBeat,
} from "../midi-musical-time";
import type { SourceTiming } from "../practice-note";

const PPQ = 480;

function timingOf(
  meters: SourceTiming["meters"],
  totalTicks: number,
  tempos: SourceTiming["tempos"] = [{ tick: 0, bpm: 120 }]
): SourceTiming {
  const timing: SourceTiming = {
    ppq: PPQ,
    totalTicks,
    tempos: Object.freeze(tempos),
    meters: Object.freeze(meters),
  };
  return Object.freeze(timing);
}

const FOUR_FOUR = timingOf(
  [{ tick: 0, numerator: 4, denominator: 4 }],
  4 * 1920
);

describe("barWindows", () => {
  it("lays out full-length windows for every bar, empty bars included", () => {
    const windows = barWindows(FOUR_FOUR);
    expect(windows).toHaveLength(4);
    expect(windows[0]).toMatchObject({ startTick: 0, endTick: 1920, beats: 4 });
    expect(windows[1]).toMatchObject({ startTick: 1920, endTick: 3840 });
    expect(windows[3]).toMatchObject({ startTick: 5760, endTick: 7680 });
  });

  it("keeps bars empty of notes at full length", () => {
    // A bar window is geometry, not note onsets: any bar can be recovered
    // even when no note starts inside it.
    expect(barWindow(FOUR_FOUR, 2)).not.toBeNull();
  });

  it("pads a trailing partial bar to full length", () => {
    const timing = timingOf(
      [{ tick: 0, numerator: 4, denominator: 4 }],
      // One note sitting at the very start of bar 2.
      2 * 1920 + 1
    );
    expect(barCount(timing)).toBe(3);
    expect(barWindow(timing, 2)).toMatchObject({ startTick: 3840, endTick: 5760 });
  });
});

describe("non-quarter denominators", () => {
  it("sizes 6/8 bars as six eighth-note beats", () => {
    const timing = timingOf(
      [{ tick: 0, numerator: 6, denominator: 8 }],
      2 * 1440
    );
    const windows = barWindows(timing);
    expect(windows).toHaveLength(2);
    // 6 beats of 4/8 quarter = 6 * 240 ticks.
    expect(windows[0].ticksPerBeat).toBe(240);
    expect(windows[0].endTick).toBe(1440);
  });

  it("maps a tick inside a 6/8 bar to fractional eighth beats", () => {
    const timing = timingOf(
      [{ tick: 0, numerator: 6, denominator: 8 }],
      1440
    );
    expect(tickToBarBeat(timing, 240)).toEqual({
      bar: 0,
      beat: 1,
      window: expect.objectContaining({ bar: 0 }),
    });
    expect(tickToBarBeat(timing, 360)!.beat).toBeCloseTo(1.5);
  });
});

describe("meter changes", () => {
  it("restarts bar boundaries when the change lands on a bar line", () => {
    // One 4/4 bar, then 3/4 from the next bar line onward.
    const timing = timingOf(
      [
        { tick: 0, numerator: 4, denominator: 4 },
        { tick: 1920, numerator: 3, denominator: 4 },
      ],
      1920 + 3 * 1440
    );
    const windows = barWindows(timing);
    expect(windows[0]).toMatchObject({ startTick: 0, endTick: 1920, beats: 4 });
    expect(windows[1]).toMatchObject({ startTick: 1920, endTick: 3360, beats: 3 });
    expect(windows[2]).toMatchObject({ startTick: 3360, endTick: 4800, beats: 3 });
    expect(windows[3]).toMatchObject({ startTick: 4800, endTick: 6240, beats: 3 });
  });

  it("applies a mid-bar meter change at the next bar boundary", () => {
    const timing = timingOf(
      [
        { tick: 0, numerator: 4, denominator: 4 },
        { tick: 480, numerator: 3, denominator: 4 },
      ],
      1920 + 3 * 1440
    );
    const windows = barWindows(timing);
    expect(windows[0]).toMatchObject({ endTick: 1920, beats: 4 });
    expect(windows[1]).toMatchObject({ startTick: 1920, beats: 3 });
  });

  it("returns 4/4 windows before a first meter change later in the piece", () => {
    const timing = timingOf([{ tick: 1920, numerator: 3, denominator: 8 }], 3840);
    expect(barWindows(timing)[0]).toMatchObject({ beats: 4, endTick: 1920 });
    expect(barWindows(timing)[1]).toMatchObject({ beats: 3, ticksPerBeat: 240 });
  });
});

describe("tickToBarBeat", () => {
  it("splits beats across bars exactly at boundaries", () => {
    expect(tickToBarBeat(FOUR_FOUR, 0)).toMatchObject({ bar: 0, beat: 0 });
    expect(tickToBarBeat(FOUR_FOUR, 1919)!.bar).toBe(0);
    expect(tickToBarBeat(FOUR_FOUR, 1920)).toMatchObject({ bar: 1, beat: 0 });
    expect(tickToBarBeat(FOUR_FOUR, 1920 + 240)).toMatchObject({
      bar: 1,
      beat: 0.5,
    });
  });

  it("returns null past the padded tail", () => {
    expect(tickToBarBeat(FOUR_FOUR, 99999)).toBeNull();
  });
});

describe("barBeatToTick", () => {
  it("round-trips bar/beat coordinates", () => {
    expect(barBeatToTick(FOUR_FOUR, 0, 0)).toBe(0);
    expect(barBeatToTick(FOUR_FOUR, 2, 3)).toBe(2 * 1920 + 3 * 480);
    expect(barBeatToTick(FOUR_FOUR, 9, 0)).toBeNull();
  });

  it("honors non-quarter denominators", () => {
    const timing = timingOf([{ tick: 0, numerator: 6, denominator: 8 }], 1440);
    expect(barBeatToTick(timing, 0, 1)).toBe(240);
  });
});

describe("empty-bar coverage", () => {
  it("recovers the full window of a bar no note touches", () => {
    // Notes in bar 0 and bar 2 only; bar 1 is a rest bar.
    const timing = timingOf([{ tick: 0, numerator: 4, denominator: 4 }], 5760 + 480);
    const silent = barWindow(timing, 1);
    expect(silent).toMatchObject({ startTick: 1920, endTick: 3840 });
    const anyNoteLands = tickToBarBeat(timing, 5760);
    expect(anyNoteLands).toMatchObject({ bar: 3 });
  });
});

describe("beatSecondsAt", () => {
  it("resolves the tempo in effect at the bar", () => {
    const timing = timingOf(
      [{ tick: 0, numerator: 4, denominator: 4 }],
      3840 + 4 * 480,
      [
        { tick: 0, bpm: 120 },
        { tick: 1920, bpm: 60 },
      ]
    );
    expect(beatSecondsAt(timing, 0)).toBeCloseTo(0.5);
    expect(beatSecondsAt(timing, 1)).toBeCloseTo(1); // the new tempo is already in effect
    expect(beatSecondsAt(timing, 2)).toBeCloseTo(1);
  });
});
