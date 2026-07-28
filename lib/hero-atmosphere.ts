/**
 * Welcome-page atmosphere kind: which math visual drives the home hero.
 *
 * Separate from per-visual parameter blobs so Apply-to-home from Chladni or
 * Quasiperiodic can switch the active background without wiping the other.
 */

export const HERO_ATMOSPHERE_SETTINGS_KEY = "hero-atmosphere-v1";
export const HERO_ATMOSPHERE_LOCAL_STORAGE_KEY =
  "piano-suite-hero-atmosphere-v1";

export type HeroAtmosphereKind = "chladni" | "quasiperiodic";

export type HeroAtmosphereSettings = {
  kind: HeroAtmosphereKind;
};

export const DEFAULT_HERO_ATMOSPHERE: HeroAtmosphereSettings = {
  kind: "chladni",
};

export function isHeroAtmosphereKind(value: unknown): value is HeroAtmosphereKind {
  return value === "chladni" || value === "quasiperiodic";
}

export function normalizeHeroAtmosphere(
  partial: Partial<HeroAtmosphereSettings> | null | undefined
): HeroAtmosphereSettings {
  const src = partial ?? {};
  return {
    kind: isHeroAtmosphereKind(src.kind)
      ? src.kind
      : DEFAULT_HERO_ATMOSPHERE.kind,
  };
}

export function readHeroAtmosphereFromLocalStorage(): HeroAtmosphereSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HERO_ATMOSPHERE_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return normalizeHeroAtmosphere(
      JSON.parse(raw) as Partial<HeroAtmosphereSettings>
    );
  } catch {
    return null;
  }
}

export function writeHeroAtmosphereToLocalStorage(
  settings: HeroAtmosphereSettings
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      HERO_ATMOSPHERE_LOCAL_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Quota / private mode — ignore.
  }
}
