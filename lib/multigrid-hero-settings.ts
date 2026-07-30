/**
 * Serializable home-hero Multigrid appearance.
 */

import { clamp } from "@/lib/chladni";
import {
  DEFAULT_RECIPE,
  normalizeRecipe,
  type MultigridRecipe,
  type MultigridViewMode,
} from "@/lib/multigrid";

export const HERO_MULTIGRID_SETTINGS_KEY = "hero-multigrid-v1";
export const HERO_MULTIGRID_LOCAL_STORAGE_KEY =
  "piano-suite-hero-multigrid-v1";

export type HeroMultigridSettings = {
  recipe: MultigridRecipe;
  nextRecipe: MultigridRecipe;
  morphSpeed: number;
  autoMorph: boolean;
  viewMode: MultigridViewMode;
  showIntersections: boolean;
  lineIntensity: number;
  colorSoftness: number;
  patternColor: string | null;
  scrimDarkness: number;
  generation: number;
};

export const DEFAULT_HERO_MULTIGRID_SETTINGS: HeroMultigridSettings = {
  recipe: {
    symmetry: 5,
    pattern: 0.2,
    rotate: 0,
    pan: 0,
    disorder: 0,
    randomSeed: 0,
    zoom: 0.9,
    radius: 55,
  },
  nextRecipe: {
    symmetry: 8,
    pattern: 0.5,
    rotate: 20,
    pan: 0.1,
    disorder: 0.1,
    randomSeed: 0.2,
    zoom: 0.9,
    radius: 55,
  },
  morphSpeed: 18,
  autoMorph: true,
  // Tiling / both marked for deletion — grid (lines) only.
  viewMode: "grid",
  showIntersections: false,
  lineIntensity: 0.55,
  colorSoftness: 0.65,
  patternColor: null,
  scrimDarkness: 0.7,
  generation: 0,
};

export type LabMultigridSnapshot = {
  recipe: MultigridRecipe;
  nextRecipe: MultigridRecipe;
  morphSpeed: number;
  autoMorph: boolean;
  viewMode: MultigridViewMode;
  showIntersections: boolean;
  lineIntensity?: number;
  colorSoftness?: number;
};

export const DEFAULT_LAB_MULTIGRID_SNAPSHOT: LabMultigridSnapshot = {
  recipe: { ...DEFAULT_RECIPE },
  nextRecipe: {
    symmetry: 13,
    pattern: 0.39,
    rotate: -40,
    pan: 0.2,
    disorder: 0.2,
    randomSeed: 0.01,
    zoom: 1,
    radius: 70,
  },
  morphSpeed: 10,
  autoMorph: true,
  // Tiling / both marked for deletion — grid (lines) only.
  viewMode: "grid",
  showIntersections: true,
  lineIntensity: 1,
  colorSoftness: 0,
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
  if (!trimmed || trimmed.length > 64) return null;
  return trimmed;
}

/** Tiling / both marked for deletion — always resolve to grid (lines). */
function asViewMode(
  value: unknown,
  fallback: MultigridViewMode
): MultigridViewMode {
  // Accept legacy values so call sites stay typed; ignore them until hard delete.
  if (value === "grid" || value === "tiling" || value === "both") {
    return "grid";
  }
  if (fallback === "grid" || fallback === "tiling" || fallback === "both") {
    return "grid";
  }
  return "grid";
}

function asRecipe(value: unknown, fallback: MultigridRecipe): MultigridRecipe {
  if (!value || typeof value !== "object") return normalizeRecipe(fallback);
  return normalizeRecipe(value as Partial<MultigridRecipe>);
}

export function normalizeHeroMultigridSettings(
  partial: Partial<HeroMultigridSettings> | null | undefined
): HeroMultigridSettings {
  const d = DEFAULT_HERO_MULTIGRID_SETTINGS;
  const src = partial ?? {};
  return {
    recipe: asRecipe(src.recipe, d.recipe),
    nextRecipe: asRecipe(src.nextRecipe, d.nextRecipe),
    morphSpeed: asNumber(src.morphSpeed, d.morphSpeed, 1, 60),
    autoMorph: typeof src.autoMorph === "boolean" ? src.autoMorph : d.autoMorph,
    viewMode: asViewMode(src.viewMode, d.viewMode),
    showIntersections:
      typeof src.showIntersections === "boolean"
        ? src.showIntersections
        : d.showIntersections,
    lineIntensity: asNumber(src.lineIntensity, d.lineIntensity, 0, 2),
    colorSoftness: asNumber(src.colorSoftness, d.colorSoftness, 0, 1),
    patternColor: asPatternColor(src.patternColor),
    scrimDarkness: asNumber(src.scrimDarkness, d.scrimDarkness, 0, 1),
    generation: asNumber(src.generation, d.generation, 0, Number.MAX_SAFE_INTEGER),
  };
}

export function mergeLabSnapshotIntoHeroMultigrid(
  current: HeroMultigridSettings,
  lab: LabMultigridSnapshot
): HeroMultigridSettings {
  return normalizeHeroMultigridSettings({
    ...current,
    recipe: lab.recipe,
    nextRecipe: lab.nextRecipe,
    morphSpeed: lab.morphSpeed,
    autoMorph: lab.autoMorph,
    viewMode: lab.viewMode,
    showIntersections: lab.showIntersections,
    lineIntensity: lab.lineIntensity ?? 1,
    colorSoftness: lab.colorSoftness ?? 0,
    generation: current.generation + 1,
  });
}

export function readHeroMultigridSettingsFromLocalStorage(): HeroMultigridSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HERO_MULTIGRID_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return normalizeHeroMultigridSettings(
      JSON.parse(raw) as Partial<HeroMultigridSettings>
    );
  } catch {
    return null;
  }
}

export function writeHeroMultigridSettingsToLocalStorage(
  settings: HeroMultigridSettings
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      HERO_MULTIGRID_LOCAL_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // ignore
  }
}
