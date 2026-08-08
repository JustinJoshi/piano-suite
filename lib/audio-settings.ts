/**
 * Audio / MIDI sound settings for Piano Suite.
 *
 * Defines the user-facing sound preferences: master on/off, volume, and the
 * selected instrument preset. Custom kits (user-uploaded .sf2 or sample maps)
 * are declared here but implemented in Milestone 2.
 */

export const AUDIO_SETTINGS_KEY = "audio";
export const AUDIO_SETTINGS_LOCAL_STORAGE_KEY = "piano-suite-audio-v1";

export type AudioPreset =
  | "splendid-grand-piano"
  | "fluidr3-piano"
  | "musyngkite-piano"
  | "fatboy-piano";

export type CustomKit =
  | { kind: "sf2"; name: string; url: string; preset: string }
  | {
      kind: "samples";
      name: string;
      map: Record<string, string>;
    };

export type AudioSettings = {
  /** Master on/off switch for MIDI-driven piano sound. */
  enabled: boolean;
  /** Output volume, 0..1. */
  volume: number;
  /** Built-in instrument preset. */
  preset: AudioPreset;
  /** Hold notes after note-off until sustain is released. */
  sustain: boolean;
  /** User-uploaded custom kit, if any. */
  customKit: CustomKit | null;
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  enabled: true,
  volume: 0.7,
  preset: "splendid-grand-piano",
  sustain: false,
  customKit: null,
};

export const AUDIO_PRESET_LABELS: Record<AudioPreset, string> = {
  "splendid-grand-piano": "Splendid Grand Piano",
  "fluidr3-piano": "FluidR3 Grand Piano",
  "musyngkite-piano": "MusyngKite Grand Piano",
  "fatboy-piano": "FatBoy Grand Piano",
};

function isAudioPreset(value: unknown): value is AudioPreset {
  return (
    typeof value === "string" &&
    Object.keys(AUDIO_PRESET_LABELS).includes(value)
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
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

function normalizeCustomKit(value: unknown): CustomKit | null {
  if (!value || typeof value !== "object") return null;
  const src = value as Record<string, unknown>;
  const kind = src.kind;
  const name = typeof src.name === "string" ? src.name.trim() : "";
  if (!name) return null;

  if (kind === "sf2") {
    const url = typeof src.url === "string" ? src.url.trim() : "";
    const preset = typeof src.preset === "string" ? src.preset.trim() : "";
    if (!url || !preset) return null;
    return { kind: "sf2", name, url, preset };
  }

  if (kind === "samples") {
    const rawMap = src.map;
    if (!rawMap || typeof rawMap !== "object") return null;
    const map: Record<string, string> = {};
    for (const [key, val] of Object.entries(rawMap)) {
      if (typeof val === "string" && val.trim()) {
        map[key] = val.trim();
      }
    }
    if (Object.keys(map).length === 0) return null;
    return { kind: "samples", name, map };
  }

  return null;
}

/**
 * Coerce a partial/unknown payload into a full AudioSettings object.
 */
export function normalizeAudioSettings(
  partial: Partial<AudioSettings> | null | undefined
): AudioSettings {
  const src = partial ?? {};
  const d = DEFAULT_AUDIO_SETTINGS;

  return {
    enabled:
      typeof src.enabled === "boolean" ? src.enabled : d.enabled,
    volume: asNumber(src.volume, d.volume, 0, 1),
    preset: isAudioPreset(src.preset) ? src.preset : d.preset,
    sustain:
      typeof src.sustain === "boolean" ? src.sustain : d.sustain,
    customKit: normalizeCustomKit(src.customKit),
  };
}

export function readAudioSettingsFromLocalStorage(): AudioSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUDIO_SETTINGS_LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return normalizeAudioSettings(
      JSON.parse(raw) as Partial<AudioSettings>
    );
  } catch {
    return null;
  }
}

export function writeAudioSettingsToLocalStorage(
  settings: AudioSettings
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      AUDIO_SETTINGS_LOCAL_STORAGE_KEY,
      JSON.stringify(settings)
    );
  } catch {
    // Quota / private mode — ignore.
  }
}
