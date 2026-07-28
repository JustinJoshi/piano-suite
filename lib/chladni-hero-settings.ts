/**
 * Serializable home-hero Chladni appearance.
 *
 * Defaults match the shipping soft full-bleed hero. Pattern Lab can overwrite
 * the full parameter set via "Apply to home"; Reset restores these defaults.
 */

import { clamp } from "@/lib/chladni";

export const HERO_CHLADNI_SETTINGS_KEY = "hero-chladni-v1";
export const HERO_CHLADNI_LOCAL_STORAGE_KEY = "piano-suite-hero-chladni-v1";

export type ModePair = [number, number];

export type HeroChladniSettings = {
  mode: ModePair;
  nextMode: ModePair;
  morphSpeed: number;
  autoMorph: boolean;
  lineThickness: number;
  zoom: number;
  secondaryOffset: ModePair;
  secondaryBlend: number;
  secondarySpeed: number;
  secondaryMotion: number;
  breathe: number;
  timeScale: number;
  lineIntensity: number;
  colorSoftness: number;
  /** Optional CSS color override for lines/glow; null = theme tokens. */
  patternColor: string | null;
  /** 0..1 strength of the hero scrim overlay (default matches shipping CSS). */
  scrimDarkness: number;
  /** Bumped on Apply / Reset so the hero can restart morph cleanly. */
  generation: number;
};

/** Exact soft-hero constants from the original ChladniBackground. */
export const DEFAULT_HERO_CHLADNI_SETTINGS: HeroChladniSettings = {
  mode: [5, 7],
  nextMode: [7, 9],
  morphSpeed: 16,
  autoMorph: true,
  lineThickness: 48,
  zoom: 1.6,
  secondaryOffset: [1, 2],
  secondaryBlend: 0.08,
  secondarySpeed: 0.6,
  secondaryMotion: 1,
  breathe: 0.1,
  timeScale: 0.7,
  lineIntensity: 0.5,
  colorSoftness: 0.7,
  patternColor: null,
  // Maps to the shipping .hero-scrim radial mix of ~70%.
  scrimDarkness: 0.7,
  generation: 0,
};

/** Lab editor defaults when exploring (vivid); Apply stamps these onto the hero. */
export const DEFAULT_LAB_PATTERN_SNAPSHOT: Omit<
  HeroChladniSettings,
  "patternColor" | "scrimDarkness" | "generation"
> = {
  mode: [5, 7],
  nextMode: [7, 9],
  morphSpeed: 8,
  autoMorph: true,
  lineThickness: 30,
  zoom: 2.33,
  secondaryOffset: [1, 2],
  secondaryBlend: 0.15,
  secondarySpeed: 1,
  secondaryMotion: 2,
  breathe: 0.2,
  timeScale: 1,
  lineIntensity: 1,
  colorSoftness: 0,
};

export type LabPatternSnapshot = {
  mode: ModePair;
  nextMode: ModePair;
  morphSpeed: number;
  autoMorph: boolean;
  lineThickness: number;
  zoom: number;
  secondaryOffset: ModePair;
  secondaryBlend: number;
  secondarySpeed: number;
  secondaryMotion: number;
  breathe: number;
  timeScale: number;
  lineIntensity?: number;
  colorSoftness?: number;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asModePair(value: unknown, fallback: ModePair): ModePair {
  if (!Array.isArray(value) || value.length < 2) return [...fallback] as ModePair;
  const a = value[0];
  const b = value[1];
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return [...fallback] as ModePair;
  return [clamp(a, 1, 20), clamp(b, 1, 20)];
}

function asOffsetPair(value: unknown, fallback: ModePair): ModePair {
  if (!Array.isArray(value) || value.length < 2) return [...fallback] as ModePair;
  const a = value[0];
  const b = value[1];
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return [...fallback] as ModePair;
  return [clamp(a, -10, 10), clamp(b, -10, 10)];
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
  // Keep short CSS color strings only (hex / named / rgb()).
  if (trimmed.length > 64) return null;
  return trimmed;
}

/**
 * Coerce a partial/unknown payload into a full HeroChladniSettings object.
 */
export function normalizeHeroChladniSettings(
  partial: Partial<HeroChladniSettings> | null | undefined
): HeroChladniSettings {
  const d = DEFAULT_HERO_CHLADNI_SETTINGS;
  const src = partial ?? {};

  return {
    mode: asModePair(src.mode, d.mode),
    nextMode: asModePair(src.nextMode, d.nextMode),
    morphSpeed: asNumber(src.morphSpeed, d.morphSpeed, 1, 60),
    autoMorph: typeof src.autoMorph === "boolean" ? src.autoMorph : d.autoMorph,
    lineThickness: asNumber(src.lineThickness, d.lineThickness, 5, 120),
    zoom: asNumber(src.zoom, d.zoom, 0.5, 8),
    secondaryOffset: asOffsetPair(src.secondaryOffset, d.secondaryOffset),
    secondaryBlend: asNumber(src.secondaryBlend, d.secondaryBlend, 0, 0.8),
    secondarySpeed: asNumber(src.secondarySpeed, d.secondarySpeed, 0, 5),
    secondaryMotion: asNumber(src.secondaryMotion, d.secondaryMotion, 0, 6),
    breathe: asNumber(src.breathe, d.breathe, 0, 1),
    timeScale: asNumber(src.timeScale, d.timeScale, 0, 3),
    lineIntensity: asNumber(src.lineIntensity, d.lineIntensity, 0, 2),
    colorSoftness: asNumber(src.colorSoftness, d.colorSoftness, 0, 1),
    patternColor: asPatternColor(src.patternColor),
    scrimDarkness: asNumber(src.scrimDarkness, d.scrimDarkness, 0, 1),
    generation: asNumber(src.generation, d.generation, 0, Number.MAX_SAFE_INTEGER),
  };
}

/**
 * Merge a Lab pattern snapshot into existing hero settings (keeps color/scrim).
 */
export function mergeLabSnapshotIntoHero(
  current: HeroChladniSettings,
  lab: LabPatternSnapshot
): HeroChladniSettings {
  return normalizeHeroChladniSettings({
    ...current,
    mode: lab.mode,
    nextMode: lab.nextMode,
    morphSpeed: lab.morphSpeed,
    autoMorph: lab.autoMorph,
    lineThickness: lab.lineThickness,
    zoom: lab.zoom,
    secondaryOffset: lab.secondaryOffset,
    secondaryBlend: lab.secondaryBlend,
    secondarySpeed: lab.secondarySpeed,
    secondaryMotion: lab.secondaryMotion,
    breathe: lab.breathe,
    timeScale: lab.timeScale,
    lineIntensity: lab.lineIntensity ?? 1,
    colorSoftness: lab.colorSoftness ?? 0,
    generation: current.generation + 1,
  });
}

/** CSS percentage string for --hero-scrim-strength from scrimDarkness 0..1. */
export function scrimStrengthCss(scrimDarkness: number): string {
  const pct = Math.round(clamp(scrimDarkness, 0, 1) * 100);
  return `${pct}%`;
}

export function readHeroChladniSettingsFromLocalStorage(): HeroChladniSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HERO_CHLADNI_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return normalizeHeroChladniSettings(JSON.parse(raw) as Partial<HeroChladniSettings>);
  } catch {
    return null;
  }
}

export function writeHeroChladniSettingsToLocalStorage(
  settings: HeroChladniSettings
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      HERO_CHLADNI_LOCAL_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Quota / private mode — ignore.
  }
}
