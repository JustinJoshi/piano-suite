import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeAudioSettings,
  readAudioSettingsFromLocalStorage,
  writeAudioSettingsToLocalStorage,
  DEFAULT_AUDIO_SETTINGS,
  AUDIO_SETTINGS_LOCAL_STORAGE_KEY,
  type AudioSettings,
} from "@/lib/audio-settings";

describe("normalizeAudioSettings", () => {
  it("returns defaults for null/undefined", () => {
    expect(normalizeAudioSettings(null)).toEqual(DEFAULT_AUDIO_SETTINGS);
    expect(normalizeAudioSettings(undefined)).toEqual(DEFAULT_AUDIO_SETTINGS);
  });

  it("clamps volume to 0..1", () => {
    expect(normalizeAudioSettings({ volume: -0.5 }).volume).toBe(0);
    expect(normalizeAudioSettings({ volume: 1.5 }).volume).toBe(1);
  });

  it("falls back to default preset for unknown values", () => {
    expect(
      normalizeAudioSettings({ preset: "not-a-preset" as never }).preset
    ).toBe(DEFAULT_AUDIO_SETTINGS.preset);
  });

  it("preserves valid custom values", () => {
    const settings: AudioSettings = {
      enabled: false,
      volume: 0.5,
      preset: "fluidr3-piano",
      sustain: true,
      customKit: {
        kind: "sf2",
        name: "My Piano",
        url: "blob:abc",
        preset: "Grand Piano",
      },
    };
    expect(normalizeAudioSettings(settings)).toEqual(settings);
  });

  it("falls back to default sustain for non-booleans", () => {
    expect(
      normalizeAudioSettings({ sustain: "yes" as never }).sustain
    ).toBe(DEFAULT_AUDIO_SETTINGS.sustain);
  });

  it("rejects malformed custom kits", () => {
    expect(
      normalizeAudioSettings({
        customKit: { kind: "sf2", name: "", url: "blob", preset: "" },
      }).customKit
    ).toBeNull();

    expect(
      normalizeAudioSettings({
        customKit: { kind: "samples", name: "Kit", map: {} },
      }).customKit
    ).toBeNull();
  });
});

describe("localStorage helpers", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUDIO_SETTINGS_LOCAL_STORAGE_KEY);
    }
  });

  it("round-trips settings", () => {
    const settings: AudioSettings = {
      enabled: false,
      volume: 0.25,
      preset: "musyngkite-piano",
      sustain: true,
      customKit: null,
    };
    writeAudioSettingsToLocalStorage(settings);
    expect(readAudioSettingsFromLocalStorage()).toEqual(settings);
  });

  it("returns null when nothing is stored", () => {
    expect(readAudioSettingsFromLocalStorage()).toBeNull();
  });

  it("gracefully ignores corrupt storage", () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUDIO_SETTINGS_LOCAL_STORAGE_KEY, "not-json");
    }
    expect(readAudioSettingsFromLocalStorage()).toBeNull();
  });
});
