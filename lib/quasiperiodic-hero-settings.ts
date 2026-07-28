/**
 * Serializable home-hero Quasiperiodic appearance.
 *
 * Soft defaults match the Chladni hero calm; Lab Apply stamps a vivid snapshot.
 */

import { clamp } from "@/lib/chladni";
import {
  DEFAULT_RECIPE,
  normalizeRecipe,
  type WaveRecipe,
} from "@/lib/quasiperiodic";

export const HERO_QUASIPERIODIC_SETTINGS_KEY = "hero-quasiperiodic-v1";
export const HERO_QUASIPERIODIC_LOCAL_STORAGE_KEY =
  "piano-suite-hero-quasiperiodic-v1";

export type HeroQuasiperiodicSettings = {
  recipe: WaveRecipe;
  nextRecipe: WaveRecipe;
  morphSpeed: number;
  autoMorph: boolean;
  lineThickness: number;
  zoom: number;
  breathe: number;
  timeScale: number;
  lineIntensity: number;
  colorSoftness: number;
  /** Optional CSS color override for lines/glow; null = theme tokens. */
  patternColor: string | null;
  /** 0..1 strength of the hero scrim overlay. */
  scrimDarkness: number;
  /** Bumped on Apply / Reset so the hero can restart morph cleanly. */
  generation: number;
};

export const DEFAULT_HERO_QUASIPERIODIC_SETTINGS: HeroQuasiperiodicSettings = {
  recipe: { folds: 5, frequency: 3.5, phase: 0 },
  nextRecipe: { folds: 7, frequency: 4.5, phase: 0.2 },
  morphSpeed: 16,
  autoMorph: true,
  lineThickness: 48,
  zoom: 1.6,
  breathe: 0.1,
  timeScale: 0.7,
  lineIntensity: 0.5,
  colorSoftness: 0.7,
  patternColor: null,
  scrimDarkness: 0.7,
  generation: 0,
};

export type LabQuasiperiodicSnapshot = {
  recipe: WaveRecipe;
  nextRecipe: WaveRecipe;
  morphSpeed: number;
  autoMorph: boolean;
  lineThickness: number;
  zoom: number;
  breathe: number;
  timeScale: number;
  lineIntensity?: number;
  colorSoftness?: number;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (!isFiniteNumber(value)) return fallback;
  return clamp(value, min, max);
}

function asPatternColor(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 64) return null;
  return trimmed;
}

function asRecipe(value: unknown, fallback: WaveRecipe): WaveRecipe {
  if (!value || typeof value !== "object") return normalizeRecipe(fallback);
  return normalizeRecipe(value as Partial<WaveRecipe>);
}

export function normalizeHeroQuasiperiodicSettings(
  partial: Partial<HeroQuasiperiodicSettings> | null | undefined
): HeroQuasiperiodicSettings {
  const d = DEFAULT_HERO_QUASIPERIODIC_SETTINGS;
  const src = partial ?? {};

  return {
    recipe: asRecipe(src.recipe, d.recipe),
    nextRecipe: asRecipe(src.nextRecipe, d.nextRecipe),
    morphSpeed: asNumber(src.morphSpeed, d.morphSpeed, 1, 60),
    autoMorph: typeof src.autoMorph === "boolean" ? src.autoMorph : d.autoMorph,
    lineThickness: asNumber(src.lineThickness, d.lineThickness, 5, 120),
    zoom: asNumber(src.zoom, d.zoom, 0.5, 8),
    breathe: asNumber(src.breathe, d.breathe, 0, 1),
    timeScale: asNumber(src.timeScale, d.timeScale, 0, 3),
    lineIntensity: asNumber(src.lineIntensity, d.lineIntensity, 0, 2),
    colorSoftness: asNumber(src.colorSoftness, d.colorSoftness, 0, 1),
    patternColor: asPatternColor(src.patternColor),
    scrimDarkness: asNumber(src.scrimDarkness, d.scrimDarkness, 0, 1),
    generation: asNumber(src.generation, d.generation, 0, Number.MAX_SAFE_INTEGER),
  };
}

export function mergeLabSnapshotIntoHeroQuasiperiodic(
  current: HeroQuasiperiodicSettings,
  lab: LabQuasiperiodicSnapshot
): HeroQuasiperiodicSettings {
  return normalizeHeroQuasiperiodicSettings({
    ...current,
    recipe: lab.recipe,
    nextRecipe: lab.nextRecipe,
    morphSpeed: lab.morphSpeed,
    autoMorph: lab.autoMorph,
    lineThickness: lab.lineThickness,
    zoom: lab.zoom,
    breathe: lab.breathe,
    timeScale: lab.timeScale,
    lineIntensity: lab.lineIntensity ?? 1,
    colorSoftness: lab.colorSoftness ?? 0,
    generation: current.generation + 1,
  });
}

export function readHeroQuasiperiodicSettingsFromLocalStorage(): HeroQuasiperiodicSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HERO_QUASIPERIODIC_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return normalizeHeroQuasiperiodicSettings(
      JSON.parse(raw) as Partial<HeroQuasiperiodicSettings>
    );
  } catch {
    return null;
  }
}

export function writeHeroQuasiperiodicSettingsToLocalStorage(
  settings: HeroQuasiperiodicSettings
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      HERO_QUASIPERIODIC_LOCAL_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Quota / private mode — ignore.
  }
}

/** Soft lab defaults used when snapping the editor after Reset home. */
export const DEFAULT_LAB_QUASIPERIODIC_SNAPSHOT: LabQuasiperiodicSnapshot = {
  recipe: { ...DEFAULT_RECIPE },
  nextRecipe: { folds: 7, frequency: 4.5, phase: 0.2 },
  morphSpeed: 8,
  autoMorph: true,
  lineThickness: 30,
  zoom: 2.33,
  breathe: 0.2,
  timeScale: 1,
  lineIntensity: 1,
  colorSoftness: 0,
};
