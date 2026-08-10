/**
 * Generic MIDI / music note impulse primitives.
 *
 * Shared foundation for all MIDI-reactive visualizations. Keeps a decaying
 * history of note-on events so multiple labs can react to velocity, timing,
 * and held notes without reimplementing the event capture logic.
 */

import { clamp } from "@/lib/chladni";

export type MidiImpulse = {
  note: number;
  pc: number;
  /** Normalized 0..1 */
  velocity: number;
  bornAt: number;
};

export type ImpulseControls = {
  /** Impulse half-life-ish window in ms (envelope reaches ~5% near the end). */
  decayMs: number;
};

/** Normalize MIDI velocity 1..127 to 0..1 (0 stays 0). */
export function normalizeVelocity(velocity: number): number {
  if (velocity <= 0) return 0;
  return clamp(velocity / 127, 0, 1);
}

/**
 * Exponential decay envelope. At age ≈ decayMs amplitude is ~5% of peak.
 */
export function impulseAmplitude(
  impulse: MidiImpulse,
  now: number,
  decayMs: number
): number {
  const window = Math.max(1, decayMs);
  const age = now - impulse.bornAt;
  if (age < 0) return impulse.velocity;
  if (age >= window) return 0;
  return impulse.velocity * Math.exp((-3 * age) / window);
}

export function pruneImpulses(
  impulses: readonly MidiImpulse[],
  now: number,
  decayMs: number
): MidiImpulse[] {
  return impulses.filter((imp) => impulseAmplitude(imp, now, decayMs) > 0.02);
}

const DEFAULT_CONTROLS: ImpulseControls = {
  decayMs: 1200,
};

export type MidiImpulseSnapshot = {
  impulses: MidiImpulse[];
  /** Maximum living amplitude right now, 0..1. */
  peakAmp: number;
  /** Newest living impulse, or null when idle. */
  newest: MidiImpulse | null;
  /** Strongest living impulse, or null when idle. */
  strongest: MidiImpulse | null;
};

/**
 * Build a snapshot of currently living impulses with derived signals.
 */
export function snapshotImpulses(
  impulses: readonly MidiImpulse[],
  now: number,
  controls: Partial<ImpulseControls> = {}
): MidiImpulseSnapshot {
  const { decayMs } = { ...DEFAULT_CONTROLS, ...controls };

  const living = impulses
    .map((imp) => ({
      imp,
      amp: impulseAmplitude(imp, now, decayMs),
    }))
    .filter((x) => x.amp > 0.02)
    .sort((a, b) => b.amp - a.amp);

  const strongest = living[0] ?? null;
  const newest =
    living.length > 0
      ? living.reduce((acc, cur) =>
          cur.imp.bornAt > acc.imp.bornAt ? cur : acc
        ).imp
      : null;

  return {
    impulses: living.map((x) => x.imp),
    peakAmp: strongest?.amp ?? 0,
    newest,
    strongest: strongest?.imp ?? null,
  };
}
