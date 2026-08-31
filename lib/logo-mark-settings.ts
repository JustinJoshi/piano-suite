/**
 * Serializable brand-mark (logo) appearance.
 *
 * Logo Lab edits a draft; "Apply logo" writes the active snapshot.
 * localStorage for everyone; Convex settings when Pro sync is available.
 */

import { clamp } from "@/lib/chladni";

export const LOGO_MARK_SETTINGS_KEY = "logo-mark-v1";
export const LOGO_MARK_LOCAL_STORAGE_KEY = "piano-suite-logo-mark-v1";

export type LogoModePair = [number, number];

export type LogoMarkSettings = {
  mode: LogoModePair;
  /** Nodal band half-width in Chladni function space (higher = thicker bands). */
  threshold: number;
  /** Extra visual weight for band cells (1..8). */
  lineThickness: number;
  /** >1 zooms into the plate center. */
  zoom: number;
  /** Inset of the pattern inside the 100×100 plate (viewBox units). */
  padding: number;
  /** Rounded-rect plate corner radius (viewBox units). */
  cornerRadius: number;
  showPlate: boolean;
  /** When true, only the outer edge cells of each band are drawn. */
  strokeOnly: boolean;
  /** Optional CSS color for the pattern; null = theme primary / currentColor. */
  patternColor: string | null;
  /** Optional CSS color for the plate; null = theme background. */
  plateColor: string | null;
  /** Bumped on Apply / Reset so consumers can remount cleanly. */
  generation: number;
};

/** Shipping default — symmetric (3,5) Chladni mark, readable at favicon size. */
export const DEFAULT_LOGO_MARK_SETTINGS: LogoMarkSettings = {
  mode: [3, 5],
  threshold: 0.12,
  lineThickness: 3,
  zoom: 1.05,
  padding: 10,
  cornerRadius: 22,
  showPlate: true,
  strokeOnly: false,
  patternColor: null,
  plateColor: null,
  generation: 0,
};

export type LogoMarkPreset = {
  label: string;
  settings: Omit<LogoMarkSettings, "generation" | "patternColor" | "plateColor">;
};

export const LOGO_MARK_PRESETS: LogoMarkPreset[] = [
  {
    label: "Default",
    settings: {
      mode: [3, 5],
      threshold: 0.12,
      lineThickness: 3,
      zoom: 1.05,
      padding: 10,
      cornerRadius: 22,
      showPlate: true,
      strokeOnly: false,
    },
  },
  {
    label: "Star",
    settings: {
      mode: [2, 3],
      threshold: 0.14,
      lineThickness: 4,
      zoom: 1.0,
      padding: 12,
      cornerRadius: 22,
      showPlate: true,
      strokeOnly: false,
    },
  },
  {
    label: "Flower",
    settings: {
      mode: [3, 5],
      threshold: 0.1,
      lineThickness: 3,
      zoom: 1.1,
      padding: 10,
      cornerRadius: 22,
      showPlate: true,
      strokeOnly: false,
    },
  },
  {
    label: "Lattice",
    settings: {
      mode: [4, 5],
      threshold: 0.09,
      lineThickness: 2,
      zoom: 1.15,
      padding: 10,
      cornerRadius: 22,
      showPlate: true,
      strokeOnly: false,
    },
  },
  {
    label: "Outline",
    settings: {
      mode: [3, 5],
      threshold: 0.16,
      lineThickness: 2,
      zoom: 1.05,
      padding: 10,
      cornerRadius: 22,
      showPlate: true,
      strokeOnly: true,
    },
  },
];

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asModePair(value: unknown, fallback: LogoModePair): LogoModePair {
  if (!Array.isArray(value) || value.length < 2) return [...fallback] as LogoModePair;
  const a = value[0];
  const b = value[1];
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return [...fallback] as LogoModePair;
  return [clamp(Math.round(a), 1, 16), clamp(Math.round(b), 1, 16)];
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

function asColor(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 64) return null;
  return trimmed;
}

export function normalizeLogoMarkSettings(
  partial: Partial<LogoMarkSettings> | null | undefined
): LogoMarkSettings {
  const d = DEFAULT_LOGO_MARK_SETTINGS;
  const src = partial ?? {};

  return {
    mode: asModePair(src.mode, d.mode),
    threshold: asNumber(src.threshold, d.threshold, 0.02, 0.45),
    lineThickness: asNumber(src.lineThickness, d.lineThickness, 1, 8),
    zoom: asNumber(src.zoom, d.zoom, 0.6, 2.5),
    padding: asNumber(src.padding, d.padding, 0, 28),
    cornerRadius: asNumber(src.cornerRadius, d.cornerRadius, 0, 40),
    showPlate: typeof src.showPlate === "boolean" ? src.showPlate : d.showPlate,
    strokeOnly:
      typeof src.strokeOnly === "boolean" ? src.strokeOnly : d.strokeOnly,
    patternColor: asColor(src.patternColor),
    plateColor: asColor(src.plateColor),
    generation: asNumber(
      src.generation,
      d.generation,
      0,
      Number.MAX_SAFE_INTEGER
    ),
  };
}

/**
 * True when the settings still describe the shipping Chladni mark.
 * Consumers render the musical-note brand instead; `generation` is ignored
 * so Apply/Reset churn does not flip the decision.
 */
export function isShippingLogoMark(settings: LogoMarkSettings): boolean {
  const { generation: _generation, ...rest } = settings;
  const { generation: _defaultGeneration, ...defaultRest } =
    DEFAULT_LOGO_MARK_SETTINGS;
  return JSON.stringify(rest) === JSON.stringify(defaultRest);
}

export function readLogoMarkSettingsFromLocalStorage(): LogoMarkSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOGO_MARK_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return normalizeLogoMarkSettings(
      JSON.parse(raw) as Partial<LogoMarkSettings>
    );
  } catch {
    return null;
  }
}

export function writeLogoMarkSettingsToLocalStorage(
  settings: LogoMarkSettings
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      LOGO_MARK_LOCAL_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Quota / private mode — ignore.
  }
}
