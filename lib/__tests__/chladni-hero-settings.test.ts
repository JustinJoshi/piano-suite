import { describe, it, expect } from "vitest";
import {
  DEFAULT_HERO_CHLADNI_SETTINGS,
  mergeLabSnapshotIntoHero,
  normalizeHeroChladniSettings,
  scrimStrengthCss,
} from "@/lib/chladni-hero-settings";

describe("normalizeHeroChladniSettings", () => {
  it("returns defaults for empty input", () => {
    expect(normalizeHeroChladniSettings({})).toEqual(DEFAULT_HERO_CHLADNI_SETTINGS);
    expect(normalizeHeroChladniSettings(null)).toEqual(DEFAULT_HERO_CHLADNI_SETTINGS);
    expect(normalizeHeroChladniSettings(undefined)).toEqual(
      DEFAULT_HERO_CHLADNI_SETTINGS
    );
  });

  it("clamps numeric fields and keeps valid color", () => {
    const next = normalizeHeroChladniSettings({
      zoom: 99,
      scrimDarkness: -1,
      patternColor: "  #abc123  ",
      mode: [0, 50],
    });
    expect(next.zoom).toBe(8);
    expect(next.scrimDarkness).toBe(0);
    expect(next.patternColor).toBe("#abc123");
    expect(next.mode).toEqual([1, 20]);
  });

  it("rejects invalid pattern colors", () => {
    expect(normalizeHeroChladniSettings({ patternColor: "" }).patternColor).toBeNull();
    expect(normalizeHeroChladniSettings({ patternColor: "x".repeat(80) }).patternColor).toBeNull();
    expect(normalizeHeroChladniSettings({ patternColor: 12 as unknown as string }).patternColor).toBeNull();
  });
});

describe("mergeLabSnapshotIntoHero", () => {
  it("copies lab pattern fields, keeps color/scrim, bumps generation", () => {
    const current = normalizeHeroChladniSettings({
      patternColor: "#ff00aa",
      scrimDarkness: 0.4,
      generation: 3,
    });
    const merged = mergeLabSnapshotIntoHero(current, {
      mode: [4, 5],
      nextMode: [6, 11],
      morphSpeed: 8,
      autoMorph: false,
      lineThickness: 30,
      zoom: 2.33,
      secondaryOffset: [1, 2],
      secondaryBlend: 0.15,
      secondarySpeed: 1,
      secondaryMotion: 2,
      breathe: 0.2,
      timeScale: 1,
    });

    expect(merged.mode).toEqual([4, 5]);
    expect(merged.nextMode).toEqual([6, 11]);
    expect(merged.morphSpeed).toBe(8);
    expect(merged.autoMorph).toBe(false);
    expect(merged.lineIntensity).toBe(1);
    expect(merged.colorSoftness).toBe(0);
    expect(merged.patternColor).toBe("#ff00aa");
    expect(merged.scrimDarkness).toBe(0.4);
    expect(merged.generation).toBe(4);
  });
});

describe("scrimStrengthCss", () => {
  it("maps darkness to a percentage", () => {
    expect(scrimStrengthCss(0.7)).toBe("70%");
    expect(scrimStrengthCss(0)).toBe("0%");
    expect(scrimStrengthCss(1)).toBe("100%");
  });
});
