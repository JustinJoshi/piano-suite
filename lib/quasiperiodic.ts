/**
 * Pure quasiperiodic wave-interference math.
 *
 * An N-fold plane-wave sum with equal angular spacing fills the plane with
 * a quasicrystal-style field. Soft-thresholding |f| yields nodal webs that
 * span infinitely as coordinates are scaled (zoom).
 *
 *   θᵢ = i · π / N
 *   f(p) = Σᵢ cos( frequency · (p · ûᵢ) + phase )
 */

import { clamp, lerp } from "@/lib/chladni";

export type WaveRecipe = {
  folds: number;
  frequency: number;
  phase: number;
};

export const MIN_FOLDS = 3;
export const MAX_FOLDS = 12;

/** Angle for wave index i of an N-fold recipe (radians). */
export function waveAngle(i: number, folds: number): number {
  const n = clampFolds(folds);
  return (i * Math.PI) / n;
}

export function clampFolds(folds: number): number {
  return Math.round(clamp(folds, MIN_FOLDS, MAX_FOLDS));
}

export function normalizeRecipe(recipe: Partial<WaveRecipe> | null | undefined): WaveRecipe {
  const d = DEFAULT_RECIPE;
  const src = recipe ?? {};
  return {
    folds: clampFolds(
      typeof src.folds === "number" && Number.isFinite(src.folds) ? src.folds : d.folds
    ),
    frequency: clamp(
      typeof src.frequency === "number" && Number.isFinite(src.frequency)
        ? src.frequency
        : d.frequency,
      0.5,
      16
    ),
    phase: clamp(
      typeof src.phase === "number" && Number.isFinite(src.phase) ? src.phase : d.phase,
      -Math.PI * 4,
      Math.PI * 4
    ),
  };
}

/**
 * Evaluate the quasiperiodic field at (x, y).
 */
export function evaluateField(x: number, y: number, recipe: WaveRecipe): number {
  const { folds, frequency, phase } = normalizeRecipe(recipe);
  let sum = 0;
  for (let i = 0; i < folds; i++) {
    const theta = waveAngle(i, folds);
    const ux = Math.cos(theta);
    const uy = Math.sin(theta);
    sum += Math.cos(frequency * (x * ux + y * uy) + phase);
  }
  return sum;
}

/**
 * Blend two fields by evaluating both and lerping (avoids fractional fold counts).
 */
export function evaluateFieldMorph(
  x: number,
  y: number,
  a: WaveRecipe,
  b: WaveRecipe,
  t: number
): number {
  const k = clamp(t, 0, 1);
  return (
    evaluateField(x, y, a) * (1 - k) + evaluateField(x, y, b) * k
  );
}

/** Linearly blend frequency/phase; folds snap via endpoint recipes (for UI display). */
export function blendRecipes(a: WaveRecipe, b: WaveRecipe, t: number): WaveRecipe {
  const k = clamp(t, 0, 1);
  const na = normalizeRecipe(a);
  const nb = normalizeRecipe(b);
  return normalizeRecipe({
    folds: k < 0.5 ? na.folds : nb.folds,
    frequency: lerp(na.frequency, nb.frequency, k),
    phase: lerp(na.phase, nb.phase, k),
  });
}

export const DEFAULT_RECIPE: WaveRecipe = {
  folds: 5,
  frequency: 4,
  phase: 0,
};

export const QUASIPERIODIC_PRESETS: {
  label: string;
  recipe: WaveRecipe;
}[] = [
  { label: "Lattice", recipe: { folds: 4, frequency: 4, phase: 0 } },
  { label: "Snowflake", recipe: { folds: 6, frequency: 3.5, phase: 0 } },
  { label: "Pentagrid", recipe: { folds: 5, frequency: 4, phase: 0 } },
  { label: "Hept", recipe: { folds: 7, frequency: 4.5, phase: 0.2 } },
  { label: "Starburst", recipe: { folds: 8, frequency: 5, phase: 0 } },
];

/**
 * Random recipe with folds in [3,12], frequency in [2,8], small phase.
 */
export function randomRecipe(): WaveRecipe {
  const folds =
    Math.floor(Math.random() * (MAX_FOLDS - MIN_FOLDS + 1)) + MIN_FOLDS;
  const frequency = 2 + Math.random() * 6;
  const phase = (Math.random() - 0.5) * Math.PI;
  return normalizeRecipe({ folds, frequency, phase });
}
