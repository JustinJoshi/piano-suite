import { describe, it, expect } from "vitest";
import {
  DEFAULT_HERO_MULTIGRID_SETTINGS,
  mergeLabSnapshotIntoHeroMultigrid,
  normalizeHeroMultigridSettings,
} from "@/lib/multigrid-hero-settings";
import { normalizeHeroAtmosphere } from "@/lib/hero-atmosphere";

describe("normalizeHeroMultigridSettings", () => {
  it("returns defaults for empty input", () => {
    expect(normalizeHeroMultigridSettings({})).toEqual(
      DEFAULT_HERO_MULTIGRID_SETTINGS
    );
  });

  it("clamps and keeps color", () => {
    const next = normalizeHeroMultigridSettings({
      scrimDarkness: 2,
      patternColor: " #ffaa00 ",
      recipe: { symmetry: 99, pattern: -1 } as never,
    });
    expect(next.scrimDarkness).toBe(1);
    expect(next.patternColor).toBe("#ffaa00");
    expect(next.recipe.symmetry).toBe(16);
    expect(next.recipe.pattern).toBe(0);
  });

  it("coerces tiling and both view modes to grid", () => {
    expect(
      normalizeHeroMultigridSettings({ viewMode: "tiling" }).viewMode
    ).toBe("grid");
    expect(normalizeHeroMultigridSettings({ viewMode: "both" }).viewMode).toBe(
      "grid"
    );
  });
});

describe("mergeLabSnapshotIntoHeroMultigrid", () => {
  it("keeps color/scrim and bumps generation", () => {
    const current = normalizeHeroMultigridSettings({
      patternColor: "#112233",
      scrimDarkness: 0.3,
      generation: 2,
    });
    const merged = mergeLabSnapshotIntoHeroMultigrid(current, {
      recipe: {
        symmetry: 13,
        pattern: 0.39,
        rotate: -10,
        pan: 0.2,
        disorder: 0.1,
        randomSeed: 0.01,
        zoom: 1,
        radius: 70,
      },
      nextRecipe: DEFAULT_HERO_MULTIGRID_SETTINGS.nextRecipe,
      morphSpeed: 8,
      autoMorph: false,
      viewMode: "both",
      showIntersections: true,
    });
    expect(merged.recipe.symmetry).toBe(13);
    // Tiling / both marked for deletion — coerced to grid.
    expect(merged.viewMode).toBe("grid");
    expect(merged.patternColor).toBe("#112233");
    expect(merged.scrimDarkness).toBe(0.3);
    expect(merged.generation).toBe(3);
    expect(merged.lineIntensity).toBe(1);
  });
});

describe("hero atmosphere accepts multigrid", () => {
  it("normalizes multigrid kind", () => {
    expect(normalizeHeroAtmosphere({ kind: "multigrid" }).kind).toBe(
      "multigrid"
    );
  });
});
