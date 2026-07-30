/**
 * Opt-in experimental product features (off by default).
 *
 * Today this gates Multigrid Lab discovery (sidebar, tools hub, atmosphere
 * pickers) and the lab page itself. localStorage for everyone; Convex sync
 * when Pro via useExperimentalFeatures.
 */

export const EXPERIMENTAL_FEATURES_SETTINGS_KEY = "experimental-features-v1";
export const EXPERIMENTAL_FEATURES_LOCAL_STORAGE_KEY =
  "piano-suite-experimental-features-v1";

export type ExperimentalFeaturesSettings = {
  enabled: boolean;
};

export const DEFAULT_EXPERIMENTAL_FEATURES: ExperimentalFeaturesSettings = {
  enabled: false,
};

/** Tool routes only shown when experimental features are enabled. */
export const EXPERIMENTAL_TOOL_HREFS = ["/tools/multigrid"] as const;

/** Ambient / hero kinds only offered when experimental features are enabled. */
export const EXPERIMENTAL_AMBIENT_KINDS = ["multigrid"] as const;

export function isExperimentalToolHref(href: string): boolean {
  return (EXPERIMENTAL_TOOL_HREFS as readonly string[]).includes(href);
}

export function isExperimentalAmbientKind(kind: string): boolean {
  return (EXPERIMENTAL_AMBIENT_KINDS as readonly string[]).includes(kind);
}

export function normalizeExperimentalFeatures(
  partial: Partial<ExperimentalFeaturesSettings> | null | undefined
): ExperimentalFeaturesSettings {
  const src = partial ?? {};
  return {
    enabled:
      typeof src.enabled === "boolean"
        ? src.enabled
        : DEFAULT_EXPERIMENTAL_FEATURES.enabled,
  };
}

export function readExperimentalFeaturesFromLocalStorage(): ExperimentalFeaturesSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(
      EXPERIMENTAL_FEATURES_LOCAL_STORAGE_KEY
    );
    if (!raw) return null;
    return normalizeExperimentalFeatures(
      JSON.parse(raw) as Partial<ExperimentalFeaturesSettings>
    );
  } catch {
    return null;
  }
}

export function writeExperimentalFeaturesToLocalStorage(
  settings: ExperimentalFeaturesSettings
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      EXPERIMENTAL_FEATURES_LOCAL_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Quota / private mode — ignore.
  }
}
