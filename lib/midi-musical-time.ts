/**
 * Pure source musical-time math for MIDI pieces. Maps between source ticks
 * and bar/beat coordinates using the piece's meter map, so a requested bar
 * window can be recovered whole — including bars with no notes — instead of
 * inferring boundaries from note onsets.
 *
 * Depends only on types from practice-note.ts; no side effects, no state.
 */

import type {
  SourceMeterChange,
  SourceTempoChange,
  SourceTiming,
} from "./practice-note";

export type SourceBarWindow = {
  /** 0-based bar index. */
  bar: number;
  /** Inclusive start tick. */
  startTick: number;
  /** Exclusive end tick; bars are full-length even at the piece's tail. */
  endTick: number;
  /** Beats per bar of the meter governing this bar (numerator). */
  beats: number;
  /** Ticks per beat of the meter governing this bar (non-quarter denominators included). */
  ticksPerBeat: number;
  /** The meter in effect for this bar. */
  numerator: number;
  denominator: number;
};

const TENTATIVE_MAX_BARS = 100_000;
const DEFAULT_METER: SourceMeterChange = {
  tick: 0,
  numerator: 4,
  denominator: 4,
};

function ticksPerBeatFor(ppq: number, denominator: number): number {
  // A beat is 4/denominator quarter notes (e.g. 6/8: 4/8 = half a quarter).
  return (ppq * 4) / denominator;
}

/**
 * One meter windows for the whole piece, walking bar boundaries under the
 * meter map. A meter change takes effect at the first bar boundary at or
 * after its tick (standard MIDI behavior).
 */
export function barWindows(timing: SourceTiming): SourceBarWindow[] {
  const ppq = timing.ppq > 0 ? timing.ppq : 480;
  const meters = [...timing.meters].sort((a, b) => a.tick - b.tick);
  const bars: SourceBarWindow[] = [];

  let index = 0;
  let meter = DEFAULT_METER;
  while (index < meters.length && meters[index].tick <= 0) {
    meter = meters[index];
    index += 1;
  }

  let tick = 0;
  while (tick < timing.totalTicks) {
    if (bars.length >= TENTATIVE_MAX_BARS) break; // corrupt meter map guard

    const ticksPerBeat = ticksPerBeatFor(ppq, meter.denominator);
    const barLength = meter.numerator * ticksPerBeat;
    bars.push({
      bar: bars.length,
      startTick: tick,
      endTick: tick + barLength,
      beats: meter.numerator,
      ticksPerBeat,
      numerator: meter.numerator,
      denominator: meter.denominator,
    });

    // A change landing inside this bar applies from the next boundary.
    while (index < meters.length && meters[index].tick <= tick + barLength) {
      meter = meters[index];
      index += 1;
    }
    tick += barLength;
  }
  return bars;
}

/** Number of source bars, including trailing partial bars and empty bars. */
export function barCount(timing: SourceTiming): number {
  if (timing.totalTicks <= 0) return 0;
  return barWindows(timing).length;
}

/** Whole window of one bar, or null when the piece has fewer bars. */
export function barWindow(
  timing: SourceTiming,
  bar: number
): SourceBarWindow | null {
  return barWindows(timing)[bar] ?? null;
}

/**
 * Locate a tick in bar/beat coordinates. Fractional beats are exact for
 * denominator divisors of the quarter note (8ths, 16ths); otherwise they are
 * the closest floating-point value.
 */
export function tickToBarBeat(
  timing: SourceTiming,
  tick: number
): { bar: number; beat: number; window: SourceBarWindow } | null {
  const windows = barWindows(timing);
  for (const window of windows) {
    if (tick < window.endTick) {
      return {
        bar: window.bar,
        beat: (tick - window.startTick) / window.ticksPerBeat,
        window,
      };
    }
  }
  return null;
}

/** Convert a bar and fractional beat back to a source tick. */
export function barBeatToTick(
  timing: SourceTiming,
  bar: number,
  beat: number
): number | null {
  const window = barWindow(timing, bar);
  if (!window) return null;
  return window.startTick + beat * window.ticksPerBeat;
}

/** Beat length in seconds for a bar's meter at that bar's source tempo. */
export function beatSecondsAt(
  timing: SourceTiming,
  bar: number
): number | null {
  const window = barWindow(timing, bar);
  if (!window) return null;
  const tempos = [...timing.tempos].sort((a, b) => a.tick - b.tick);
  if (tempos.length === 0) return null;
  let bpm = tempos[0].bpm;
  for (const tempo of tempos) {
    if (tempo.tick <= window.startTick) bpm = tempo.bpm;
    else break;
  }
  return 60 / bpm;
}

/** The piece-wide timing, normalized defensively; null when unusable. */
export function normalizeSourceTiming(value: unknown): SourceTiming | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Partial<SourceTiming>;
  if (typeof raw.ppq !== "number" || raw.ppq <= 0) return null;
  if (typeof raw.totalTicks !== "number" || raw.totalTicks < 0) return null;
  if (!Array.isArray(raw.meters) || !Array.isArray(raw.tempos)) return null;
  return {
    ppq: raw.ppq,
    totalTicks: raw.totalTicks,
    tempos: raw.tempos as readonly SourceTempoChange[],
    meters: raw.meters as readonly SourceMeterChange[],
  };
}
