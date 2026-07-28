/**
 * Pure Lissajous-curve math.
 *
 * Lissajous figures are the parametric curves
 *   x(t) = sin(a · t + δ)
 *   y(t) = sin(b · t)
 * where the frequency ratio a:b maps to a musical interval when reduced,
 * and δ is the relative phase between the two oscillators.
 */

import { clamp, lerp } from "@/lib/chladni";

/** Frequency pair and relative phase for a Lissajous figure. */
export type LissajousParams = {
  a: number;
  b: number;
  delta: number;
};

export type LissajousPreset = {
  label: string;
  /** Musical interval name shown in the lab UI. */
  interval: string;
  a: number;
  b: number;
  /** Default phase for a recognisable figure (radians). */
  delta: number;
};

/**
 * Curated integer ratios that map to common musical intervals.
 * Default deltas favour open, readable figures rather than lines.
 */
export const LISSAJOUS_PRESETS: LissajousPreset[] = [
  { label: "Unison", interval: "Unison", a: 1, b: 1, delta: Math.PI / 2 },
  { label: "Octave", interval: "Octave", a: 2, b: 1, delta: Math.PI / 2 },
  { label: "Fifth", interval: "Perfect fifth", a: 3, b: 2, delta: Math.PI / 2 },
  { label: "Fourth", interval: "Perfect fourth", a: 4, b: 3, delta: Math.PI / 2 },
  {
    label: "Major 3rd",
    interval: "Major third",
    a: 5,
    b: 4,
    delta: Math.PI / 2,
  },
  {
    label: "Minor 3rd",
    interval: "Minor third",
    a: 6,
    b: 5,
    delta: Math.PI / 2,
  },
  {
    label: "Minor 6th",
    interval: "Minor sixth",
    a: 8,
    b: 5,
    delta: Math.PI / 2,
  },
  {
    label: "Tritone-ish",
    interval: "Near tritone",
    a: 7,
    b: 5,
    delta: Math.PI / 2,
  },
];

/** Euclidean greatest common divisor for positive integers. */
export function gcd(x: number, y: number): number {
  let a = Math.abs(Math.round(x));
  let b = Math.abs(Math.round(y));
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a === 0 ? 1 : a;
}

/** Reduce an integer frequency ratio to lowest terms. */
export function reduceRatio(a: number, b: number): [number, number] {
  const ai = Math.max(1, Math.round(a));
  const bi = Math.max(1, Math.round(b));
  const d = gcd(ai, bi);
  return [ai / d, bi / d];
}

/**
 * Look up a friendly interval label for a reduced ratio.
 * Falls back to `"Custom ratio"` when the pair is not a curated preset.
 */
export function intervalName(a: number, b: number): string {
  const [ra, rb] = reduceRatio(a, b);
  const match = LISSAJOUS_PRESETS.find((p) => {
    const [pa, pb] = reduceRatio(p.a, p.b);
    return pa === ra && pb === rb;
  });
  return match?.interval ?? "Custom ratio";
}

/** Format `a:b — Interval name` for the parameters card. */
export function formatRatioLabel(a: number, b: number): string {
  const [ra, rb] = reduceRatio(a, b);
  return `${ra}:${rb} — ${intervalName(a, b)}`;
}

/**
 * Evaluate the Lissajous curve at parameter t.
 * Returns a point in the unit square [-1, 1]².
 */
export function pointAt(
  t: number,
  a: number,
  b: number,
  delta: number
): [number, number] {
  return [Math.sin(a * t + delta), Math.sin(b * t)];
}

/** Linearly interpolate two Lissajous parameter sets. */
export function lerpParams(
  from: LissajousParams,
  to: LissajousParams,
  t: number
): LissajousParams {
  const k = clamp(t, 0, 1);
  return {
    a: lerp(from.a, to.a, k),
    b: lerp(from.b, to.b, k),
    delta: lerp(from.delta, to.delta, k),
  };
}

/**
 * Pick a random frequency ratio in [1, max] with a random phase.
 * Prefers pairs that are not identical (except allowing 1:1 occasionally).
 */
export function randomRatio(max = 8): LissajousParams {
  const cap = Math.max(2, Math.floor(max));
  const a = Math.floor(Math.random() * cap) + 1;
  let b = Math.floor(Math.random() * cap) + 1;
  // Bias away from unison so Random feels distinct from the Unison preset.
  if (b === a && Math.random() < 0.7) {
    b = ((a % cap) + 1);
  }
  const delta = Math.round(Math.random() * Math.PI * 2 * 1000) / 1000;
  return { a, b, delta };
}

/** Clamp frequency integers and wrap phase into [0, 2π]. */
export function clampParams(
  params: LissajousParams,
  minFreq = 1,
  maxFreq = 12
): LissajousParams {
  const twoPi = Math.PI * 2;
  let delta = params.delta % twoPi;
  if (delta < 0) delta += twoPi;
  return {
    a: Math.round(clamp(params.a, minFreq, maxFreq)),
    b: Math.round(clamp(params.b, minFreq, maxFreq)),
    delta,
  };
}
