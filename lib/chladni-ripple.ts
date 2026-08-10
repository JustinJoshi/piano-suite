/**
 * MIDI → Chladni mode mapping for the Chladni Ripple Lab.
 *
 * Plate eigenmodes are not 12-TET harmonics. This module provides a designed
 * map: pitch class → curated (m, n) identity, octave → denser modes,
 * velocity / held density → intensity and secondary blend.
 */

import { clamp } from "@/lib/chladni";
import {
  impulseAmplitude,
  type MidiImpulse,
} from "@/lib/midi-impulse";

export type { MidiImpulse } from "@/lib/midi-impulse";

export type ModePair = [number, number];

/**
 * One curated (m, n) pair per pitch class (0 = C … 11 = B).
 * Pairs are distinct and avoid m === n (trivial diagonal modes).
 */
export const PC_MODE_TABLE: readonly ModePair[] = [
  [4, 5], // C
  [5, 6], // C#
  [5, 7], // D
  [4, 7], // D#
  [6, 8], // E
  [7, 9], // F
  [5, 8], // F#
  [6, 9], // G
  [7, 10], // G#
  [8, 10], // A
  [6, 11], // A#
  [8, 11], // B
] as const;

/** Soft idle pattern when nothing is held and impulses have decayed. */
export const IDLE_MODE: ModePair = [5, 7];

export type ChladniRippleControls = {
  /** Impulse half-life-ish window in ms (envelope reaches ~5% near the end). */
  decayMs: number;
  /** How strongly octave shifts m,n away from the PC base (typical 0.2–0.5). */
  octaveComplexity: number;
  baseLineThickness: number;
  baseIntensity: number;
};

export type ChladniRippleVizState = {
  mode: ModePair;
  nextMode: ModePair;
  morph: number;
  secondaryBlend: number;
  lineThickness: number;
  lineIntensity: number;
  breathe: number;
  /** Loudest / newest driving pitch class, or null when idle. */
  activePc: number | null;
  activeMode: ModePair;
};

/** MIDI note number → pitch class 0..11. */
export function pitchClass(note: number): number {
  return ((note % 12) + 12) % 12;
}

/** MIDI note number → scientific octave (C4 = MIDI 60 → 4). */
export function midiOctave(note: number): number {
  return Math.floor(note / 12) - 1;
}

/**
 * Modal “energy” index used to compare density: m² + n².
 * Higher values → denser nodal fields (and higher plate eigenfrequencies).
 */
export function modeEnergy(mode: ModePair): number {
  return mode[0] * mode[0] + mode[1] * mode[1];
}

/**
 * Scale a base PC mode by octave relative to C4 (octave 4).
 * Higher octaves increase m and n; lower octaves shrink them (min 2).
 */
export function scaleModeForOctave(
  base: ModePair,
  octave: number,
  octaveComplexity: number
): ModePair {
  const factor = 1 + (octave - 4) * clamp(octaveComplexity, 0, 1);
  const m = Math.max(2, Math.round(base[0] * factor));
  let n = Math.max(2, Math.round(base[1] * factor));
  if (m === n) {
    n += 1;
  }
  return [m, n];
}

/** Pitch-class identity + octave density for a MIDI note. */
export function modeForNote(
  note: number,
  octaveComplexity = 0.35
): ModePair {
  const pc = pitchClass(note);
  const base = PC_MODE_TABLE[pc] ?? IDLE_MODE;
  return scaleModeForOctave(base, midiOctave(note), octaveComplexity);
}

const DEFAULT_CONTROLS: ChladniRippleControls = {
  decayMs: 1200,
  octaveComplexity: 0.35,
  baseLineThickness: 28,
  baseIntensity: 0.45,
};

/**
 * Map held MIDI notes + decaying impulses into Chladni visualization props.
 *
 * - Primary mode: newest held note (else strongest living impulse, else idle)
 * - Secondary / morph: second held note when a chord is down
 * - Intensity / breathe / thickness: peak living impulse amplitude
 */
export function mapMidiToChladni(
  heldNotes: readonly number[],
  impulses: readonly MidiImpulse[],
  now: number,
  controls: Partial<ChladniRippleControls> = {}
): ChladniRippleVizState {
  const {
    decayMs,
    octaveComplexity,
    baseLineThickness,
    baseIntensity,
  } = { ...DEFAULT_CONTROLS, ...controls };

  const living = impulses
    .map((imp) => ({
      imp,
      amp: impulseAmplitude(imp, now, decayMs),
    }))
    .filter((x) => x.amp > 0.02)
    .sort((a, b) => b.amp - a.amp);

  const peakAmp = living[0]?.amp ?? 0;

  let primaryNote: number | null = null;
  let secondaryNote: number | null = null;

  if (heldNotes.length > 0) {
    // Newest = last in MIDI arrival order is unknown; use highest note as
    // secondary cue and the most recent impulse among held as primary.
    const heldSet = new Set(heldNotes);
    const recentHeld = [...impulses]
      .reverse()
      .find((imp) => heldSet.has(imp.note));
    primaryNote = recentHeld?.note ?? heldNotes[heldNotes.length - 1]!;
    const others = heldNotes.filter((n) => n !== primaryNote);
    secondaryNote = others.length > 0 ? others[others.length - 1]! : null;
  } else if (living[0]) {
    primaryNote = living[0].imp.note;
  }

  if (primaryNote == null) {
    return {
      mode: IDLE_MODE,
      nextMode: IDLE_MODE,
      morph: 0,
      secondaryBlend: 0.08,
      lineThickness: baseLineThickness * 0.85,
      lineIntensity: baseIntensity * 0.55,
      breathe: 0.12,
      activePc: null,
      activeMode: IDLE_MODE,
    };
  }

  const mode = modeForNote(primaryNote, octaveComplexity);
  const nextMode =
    secondaryNote != null
      ? modeForNote(secondaryNote, octaveComplexity)
      : mode;

  const chordExtra = heldNotes.length > 1 ? Math.min(0.45, (heldNotes.length - 1) * 0.18) : 0;
  const morph = secondaryNote != null ? clamp(0.25 + chordExtra, 0, 0.7) : 0;
  const secondaryBlend = clamp(0.1 + chordExtra + peakAmp * 0.15, 0.08, 0.55);

  const lineIntensity = clamp(baseIntensity + peakAmp * 0.75, 0.35, 1.35);
  const lineThickness = baseLineThickness * (0.9 + peakAmp * 0.45);
  const breathe = clamp(0.15 + peakAmp * 0.55, 0.1, 0.85);

  return {
    mode,
    nextMode,
    morph,
    secondaryBlend,
    lineThickness,
    lineIntensity,
    breathe,
    activePc: pitchClass(primaryNote),
    activeMode: mode,
  };
}
