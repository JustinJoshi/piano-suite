/**
 * Per-route ambient visual effects: full-page backgrounds + float panel.
 *
 * Kinds reuse the shipped props-only visualizations. MIDI reactivity is
 * limited to `chladni-ripple` in v1. Persistence is localStorage + Convex
 * via useAmbientEffects (same hybrid pattern as hero atmosphere).
 */

import { clamp } from "@/lib/chladni";
import type { Complex } from "@/lib/julia";
import type { LissajousParams } from "@/lib/lissajous";
import {
  HERO_ATMOSPHERE_LOCAL_STORAGE_KEY,
  type HeroAtmosphereKind,
} from "@/lib/hero-atmosphere";

export const AMBIENT_EFFECTS_SETTINGS_KEY = "ambient-effects-v1";
export const AMBIENT_EFFECTS_LOCAL_STORAGE_KEY =
  "piano-suite-ambient-effects-v1";

export const AMBIENT_EFFECT_KINDS = [
  "none",
  "chladni",
  "quasiperiodic",
  "chladni-ripple",
  "julia",
  "lissajous",
] as const;

export type AmbientEffectKind = (typeof AMBIENT_EFFECT_KINDS)[number];

/** Kinds that can drive a float panel (excludes "none"). */
export type AmbientFloatKind = Exclude<AmbientEffectKind, "none">;

export type AmbientFloatSettings = {
  enabled: boolean;
  kind: AmbientFloatKind;
  /** Empty = show on every route. Otherwise only listed pathnames. */
  routes: string[];
  /** Normalized viewport rect (0..1). */
  rect: { x: number; y: number; w: number; h: number };
};

export type AmbientEffectsSettings = {
  defaultBackground: AmbientEffectKind;
  applyEverywhere: boolean;
  routeBackgrounds: Record<string, AmbientEffectKind>;
  float: AmbientFloatSettings;
  /** 0..1 strength of the ambient scrim overlay. */
  scrimDarkness: number;
};

/** Routes shown in the Atmosphere settings UI. */
export const AMBIENT_ROUTE_CATALOG: readonly {
  href: string;
  label: string;
}[] = [
  { href: "/", label: "Welcome" },
  { href: "/tools/chord-drill", label: "Chord Drill" },
  { href: "/tools/arpeggios", label: "Arpeggios" },
  { href: "/tools/root-cycling", label: "Root Cycling" },
  { href: "/tools/progression", label: "Progression" },
  { href: "/tools/technique", label: "Technique" },
  { href: "/tools/tracking", label: "Tracking" },
  { href: "/tools/chladni", label: "Chladni Lab" },
  { href: "/tools/chladni-ripple", label: "Chladni Ripple" },
  { href: "/tools/julia", label: "Julia Lab" },
  { href: "/tools/lissajous", label: "Lissajous Lab" },
  { href: "/tools/quasiperiodic", label: "Quasiperiodic Lab" },
] as const;

export const AMBIENT_EFFECT_LABELS: Record<AmbientEffectKind, string> = {
  none: "None",
  chladni: "Chladni",
  quasiperiodic: "Quasiperiodic",
  "chladni-ripple": "Chladni Ripple (MIDI)",
  julia: "Julia",
  lissajous: "Lissajous",
};

const DEFAULT_FLOAT_RECT = { x: 0.62, y: 0.55, w: 0.32, h: 0.32 };

export const DEFAULT_AMBIENT_EFFECTS: AmbientEffectsSettings = {
  defaultBackground: "chladni",
  applyEverywhere: false,
  routeBackgrounds: { "/": "chladni" },
  float: {
    enabled: false,
    kind: "chladni-ripple",
    routes: [],
    rect: { ...DEFAULT_FLOAT_RECT },
  },
  scrimDarkness: 0.55,
};

/** Soft MIDI ripple defaults for ambient use (quieter than the lab). */
export const AMBIENT_RIPPLE_CONTROLS = {
  decayMs: 1400,
  octaveComplexity: 0.35,
  baseLineThickness: 36,
  baseIntensity: 0.35,
} as const;

export const AMBIENT_RIPPLE_VIZ = {
  zoom: 1.8,
  colorSoftness: 0.55,
  secondaryOffset: [1, 2] as [number, number],
  secondarySpeed: 0.7,
  secondaryMotion: 1,
} as const;

/** Soft Julia ambient defaults. */
export const AMBIENT_JULIA = {
  c: [-0.75, 0.11] as Complex,
  nextC: [-0.12, 0.77] as Complex,
  zoom: 1.1,
  maxIterations: 96,
  escapeRadius: 4,
  colorSoftness: 0.55,
  timeScale: 0.5,
  morphSpeedMs: 18000,
} as const;

/** Soft Lissajous ambient defaults. */
export const AMBIENT_LISSAJOUS = {
  params: { a: 3, b: 2, delta: Math.PI / 2 } as LissajousParams,
  nextParams: { a: 4, b: 3, delta: Math.PI / 3 } as LissajousParams,
  sweepSpeed: 0.7,
  trailFade: 0.04,
  lineThickness: 1.5,
  zoom: 0.8,
  colorSoftness: 0.55,
  morphSpeedMs: 16000,
} as const;

export function isAmbientEffectKind(
  value: unknown
): value is AmbientEffectKind {
  return (
    typeof value === "string" &&
    (AMBIENT_EFFECT_KINDS as readonly string[]).includes(value)
  );
}

export function isAmbientFloatKind(value: unknown): value is AmbientFloatKind {
  return isAmbientEffectKind(value) && value !== "none";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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

function normalizeRect(
  value: unknown,
  fallback: AmbientFloatSettings["rect"]
): AmbientFloatSettings["rect"] {
  if (!value || typeof value !== "object") return { ...fallback };
  const src = value as Record<string, unknown>;
  const w = asNumber(src.w, fallback.w, 0.12, 0.9);
  const h = asNumber(src.h, fallback.h, 0.12, 0.9);
  const x = asNumber(src.x, fallback.x, 0, 1 - w);
  const y = asNumber(src.y, fallback.y, 0, 1 - h);
  return { x, y, w, h };
}

function normalizeRouteBackgrounds(
  value: unknown
): Record<string, AmbientEffectKind> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...DEFAULT_AMBIENT_EFFECTS.routeBackgrounds };
  }
  const out: Record<string, AmbientEffectKind> = {};
  for (const [path, kind] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (typeof path !== "string" || path.length === 0) continue;
    if (isAmbientEffectKind(kind)) {
      out[path] = kind;
    }
  }
  return out;
}

function normalizeFloatRoutes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (r): r is string => typeof r === "string" && r.length > 0
  );
}

function normalizeFloat(value: unknown): AmbientFloatSettings {
  const d = DEFAULT_AMBIENT_EFFECTS.float;
  if (!value || typeof value !== "object") {
    return {
      enabled: d.enabled,
      kind: d.kind,
      routes: [...d.routes],
      rect: { ...d.rect },
    };
  }
  const src = value as Record<string, unknown>;
  return {
    enabled: typeof src.enabled === "boolean" ? src.enabled : d.enabled,
    kind: isAmbientFloatKind(src.kind) ? src.kind : d.kind,
    routes: normalizeFloatRoutes(src.routes),
    rect: normalizeRect(src.rect, d.rect),
  };
}

export function normalizeAmbientEffects(
  partial: Partial<AmbientEffectsSettings> | null | undefined
): AmbientEffectsSettings {
  const src = partial ?? {};
  return {
    defaultBackground: isAmbientEffectKind(src.defaultBackground)
      ? src.defaultBackground
      : DEFAULT_AMBIENT_EFFECTS.defaultBackground,
    applyEverywhere:
      typeof src.applyEverywhere === "boolean"
        ? src.applyEverywhere
        : DEFAULT_AMBIENT_EFFECTS.applyEverywhere,
    routeBackgrounds: normalizeRouteBackgrounds(src.routeBackgrounds),
    float: normalizeFloat(src.float),
    scrimDarkness: asNumber(
      src.scrimDarkness,
      DEFAULT_AMBIENT_EFFECTS.scrimDarkness,
      0,
      1
    ),
  };
}

/**
 * Resolve which background kind to show for a pathname.
 *
 * Explicit route entry wins. Otherwise applyEverywhere → default.
 * Home (`/`) falls back to defaultBackground so a missing `/` key still
 * shows an atmosphere. All other routes fall back to `none`.
 */
export function resolveBackgroundKind(
  pathname: string,
  settings: AmbientEffectsSettings
): AmbientEffectKind {
  const path = pathname === "" ? "/" : pathname;
  const override = settings.routeBackgrounds[path];
  if (override !== undefined) return override;
  if (settings.applyEverywhere) return settings.defaultBackground;
  if (path === "/") return settings.defaultBackground;
  return "none";
}

/** Whether the float panel should appear on this pathname. */
export function resolveFloatVisible(
  pathname: string,
  settings: AmbientEffectsSettings
): boolean {
  if (!settings.float.enabled) return false;
  if (settings.float.routes.length === 0) return true;
  const path = pathname === "" ? "/" : pathname;
  return settings.float.routes.includes(path);
}

/** Map a hero atmosphere kind onto an ambient kind for seeding. */
export function heroKindToAmbient(
  kind: HeroAtmosphereKind
): AmbientEffectKind {
  return kind === "quasiperiodic" ? "quasiperiodic" : "chladni";
}

/**
 * Seed defaults from existing hero-atmosphere localStorage so first-run
 * ambient settings match what the user already has on the home page.
 */
export function seedAmbientFromHeroAtmosphere(): AmbientEffectsSettings {
  const base = normalizeAmbientEffects(DEFAULT_AMBIENT_EFFECTS);
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(HERO_ATMOSPHERE_LOCAL_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as { kind?: unknown };
    if (parsed.kind === "chladni" || parsed.kind === "quasiperiodic") {
      const kind = heroKindToAmbient(parsed.kind);
      return normalizeAmbientEffects({
        ...base,
        defaultBackground: kind,
        routeBackgrounds: { ...base.routeBackgrounds, "/": kind },
      });
    }
  } catch {
    // ignore
  }
  return base;
}

export function readAmbientEffectsFromLocalStorage(): AmbientEffectsSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AMBIENT_EFFECTS_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return normalizeAmbientEffects(
      JSON.parse(raw) as Partial<AmbientEffectsSettings>
    );
  } catch {
    return null;
  }
}

export function writeAmbientEffectsToLocalStorage(
  settings: AmbientEffectsSettings
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      AMBIENT_EFFECTS_LOCAL_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Quota / private mode — ignore.
  }
}

/** CSS custom-property helpers for ambient scrim (mirrors hero). */
export function ambientScrimStrengthCss(scrimDarkness: number): string {
  const pct = Math.round(clamp(scrimDarkness, 0, 1) * 100);
  return `${pct}%`;
}
