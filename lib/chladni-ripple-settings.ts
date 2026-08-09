/**
 * Serializable Chladni Ripple appearance for ambient backgrounds and the lab.
 *
 * These parameters are used whenever the ambient kind is "chladni-ripple".
 * The lab can overwrite them and apply them to the welcome page or default
 * ambient background; Reset restores the shipping defaults.
 */

import { clamp } from "@/lib/chladni";

export const RIPPLE_SETTINGS_KEY = "chladni-ripple-v1";
export const RIPPLE_LOCAL_STORAGE_KEY = "piano-suite-chladni-ripple-v1";

export type ModePair = [number, number];

export type ChladniRippleParams = {
  /** Impulse half-life-ish window in ms. */
  decayMs: number;
  /** How strongly octave shifts m,n away from the PC base. */
  octaveComplexity: number;
  /** Base line thickness before velocity boosts it. */
  baseLineThickness: number;
  /** Base intensity before velocity boosts it. */
  baseIntensity: number;
  /** Zoom scale of the pattern. */
  zoom: number;
  /** Offset of the secondary mode from the primary mode. */
  secondaryOffset: ModePair;
  /** Blend strength of the secondary mode, 0..1. */
  secondaryBlend: number;
  /** Speed of the secondary mode's time-based motion. */
  secondarySpeed: number;
  /** Amplitude of the secondary mode's time-based motion. */
  secondaryMotion: number;
  /** How far theme line/glow colors are mixed toward the background. */
  colorSoftness: number;
  /** Multiplier for all internal time-based animation speeds. */
  timeScale: number;
};

/** Soft defaults used for ambient backgrounds and the lab reset. */
export const DEFAULT_RIPPLE_PARAMS: ChladniRippleParams = {
  decayMs: 1200,
  octaveComplexity: 0.35,
  baseLineThickness: 28,
  baseIntensity: 0.45,
  zoom: 2.2,
  secondaryOffset: [1, 2],
  secondaryBlend: 0.15,
  secondarySpeed: 1,
  secondaryMotion: 1.5,
  colorSoftness: 0.15,
  timeScale: 1,
};

/** Quieter ambient-background defaults. */
export const AMBIENT_RIPPLE_PARAMS: ChladniRippleParams = {
  ...DEFAULT_RIPPLE_PARAMS,
  decayMs: 1400,
  baseLineThickness: 36,
  baseIntensity: 0.35,
  zoom: 1.8,
  secondaryBlend: 0.08,
  colorSoftness: 0.55,
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asOffsetPair(value: unknown, fallback: ModePair): ModePair {
  if (!Array.isArray(value) || value.length < 2) return [...fallback] as ModePair;
  const a = value[0];
  const b = value[1];
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return [...fallback] as ModePair;
  return [clamp(a, -10, 10), clamp(b, -10, 10)];
}

function asNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  if (!isFiniteNumber(value)) return fallback;
  return clamp(value, min, max);
}

/**
 * Coerce a partial/unknown payload into a full ChladniRippleParams object.
 */
export function normalizeChladniRippleParams(
  partial: Partial<ChladniRippleParams> | null | undefined
): ChladniRippleParams {
  const d = DEFAULT_RIPPLE_PARAMS;
  const src = partial ?? {};

  return {
    decayMs: asNumber(src.decayMs, d.decayMs, 100, 5000),
    octaveComplexity: asNumber(src.octaveComplexity, d.octaveComplexity, 0, 1),
    baseLineThickness: asNumber(
      src.baseLineThickness,
      d.baseLineThickness,
      5,
      120
    ),
    baseIntensity: asNumber(src.baseIntensity, d.baseIntensity, 0.1, 2),
    zoom: asNumber(src.zoom, d.zoom, 0.5, 8),
    secondaryOffset: asOffsetPair(src.secondaryOffset, d.secondaryOffset),
    secondaryBlend: asNumber(src.secondaryBlend, d.secondaryBlend, 0, 0.8),
    secondarySpeed: asNumber(src.secondarySpeed, d.secondarySpeed, 0, 5),
    secondaryMotion: asNumber(src.secondaryMotion, d.secondaryMotion, 0, 6),
    colorSoftness: asNumber(src.colorSoftness, d.colorSoftness, 0, 1),
    timeScale: asNumber(src.timeScale, d.timeScale, 0, 3),
  };
}

export function readChladniRippleParamsFromLocalStorage(): ChladniRippleParams | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RIPPLE_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return normalizeChladniRippleParams(
      JSON.parse(raw) as Partial<ChladniRippleParams>
    );
  } catch {
    return null;
  }
}

export function writeChladniRippleParamsToLocalStorage(
  params: ChladniRippleParams
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      RIPPLE_LOCAL_STORAGE_KEY,
      JSON.stringify(params)
    );
  } catch {
    // Quota / private mode — ignore.
  }
}
