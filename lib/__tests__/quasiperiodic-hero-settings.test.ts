import { describe, it, expect } from "vitest";
import {
  DEFAULT_HERO_QUASIPERIODIC_SETTINGS,
  mergeLabSnapshotIntoHeroQuasiperiodic,
  normalizeHeroQuasiperiodicSettings,
} from "@/lib/quasiperiodic-hero-settings";
import {
  DEFAULT_HERO_ATMOSPHERE,
  normalizeHeroAtmosphere,
} from "@/lib/hero-atmosphere";

describe("normalizeHeroQuasiperiodicSettings", () => {
  it("returns defaults for empty input", () => {
    expect(normalizeHeroQuasiperiodicSettings({})).toEqual(
      DEFAULT_HERO_QUASIPERIODIC_SETTINGS
    );
    expect(normalizeHeroQuasiperiodicSettings(null)).toEqual(
      DEFAULT_HERO_QUASIPERIODIC_SETTINGS
    );
  });

  it("clamps numeric fields and keeps valid color", () => {
    const next = normalizeHeroQuasiperiodicSettings({
      zoom: 99,
      scrimDarkness: -1,
      patternColor: "  #abc123  ",
      recipe: { folds: 1, frequency: 100, phase: 0 },
    });
    expect(next.zoom).toBe(8);
    expect(next.scrimDarkness).toBe(0);
    expect(next.patternColor).toBe("#abc123");
    expect(next.recipe.folds).toBe(3);
    expect(next.recipe.frequency).toBe(16);
  });
});

describe("mergeLabSnapshotIntoHeroQuasiperiodic", () => {
  it("copies lab fields, keeps color/scrim, bumps generation", () => {
    const current = normalizeHeroQuasiperiodicSettings({
      patternColor: "#ff00aa",
      scrimDarkness: 0.4,
      generation: 3,
    });
    const merged = mergeLabSnapshotIntoHeroQuasiperiodic(current, {
      recipe: { folds: 5, frequency: 4, phase: 0 },
      nextRecipe: { folds: 8, frequency: 5, phase: 0.1 },
      morphSpeed: 8,
      autoMorph: false,
      lineThickness: 30,
      zoom: 2.33,
      breathe: 0.2,
      timeScale: 1,
    });

    expect(merged.recipe.folds).toBe(5);
    expect(merged.nextRecipe.folds).toBe(8);
    expect(merged.morphSpeed).toBe(8);
    expect(merged.autoMorph).toBe(false);
    expect(merged.lineIntensity).toBe(1);
    expect(merged.colorSoftness).toBe(0);
    expect(merged.patternColor).toBe("#ff00aa");
    expect(merged.scrimDarkness).toBe(0.4);
    expect(merged.generation).toBe(4);
  });
});

describe("normalizeHeroAtmosphere", () => {
  it("defaults to chladni", () => {
    expect(normalizeHeroAtmosphere({})).toEqual(DEFAULT_HERO_ATMOSPHERE);
    expect(normalizeHeroAtmosphere({ kind: "nope" as "chladni" }).kind).toBe(
      "chladni"
    );
  });

  it("accepts quasiperiodic", () => {
    expect(normalizeHeroAtmosphere({ kind: "quasiperiodic" }).kind).toBe(
      "quasiperiodic"
    );
  });
});
