import { describe, it, expect } from "vitest";
import {
  blendRecipes,
  buildGridLines,
  buildMultigridScene,
  clampSymmetry,
  computeOffsets,
  createSeededRandom,
  DEFAULT_RECIPE,
  MULTIGRID_PRESETS,
  normalizeRecipe,
  uniqueOrientationKeys,
} from "@/lib/multigrid";

describe("normalizeRecipe / clampSymmetry", () => {
  it("clamps symmetry to 3..16", () => {
    expect(clampSymmetry(1)).toBe(3);
    expect(clampSymmetry(99)).toBe(16);
  });

  it("fills defaults", () => {
    expect(normalizeRecipe({})).toEqual(DEFAULT_RECIPE);
  });
});

describe("createSeededRandom", () => {
  it("is deterministic for the same seed", () => {
    const a = createSeededRandom(0.42);
    const b = createSeededRandom(0.42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("computeOffsets", () => {
  it("returns symmetry-length offsets", () => {
    const offs = computeOffsets({ ...DEFAULT_RECIPE, symmetry: 5, pattern: 0.2 });
    expect(offs).toHaveLength(5);
    expect(offs.every((o) => Math.abs(o - 0.2) < 1e-9)).toBe(true);
  });

  it("applies disorder stably for a seed", () => {
    const a = computeOffsets({
      ...DEFAULT_RECIPE,
      symmetry: 7,
      disorder: 0.4,
      randomSeed: 0.11,
    });
    const b = computeOffsets({
      ...DEFAULT_RECIPE,
      symmetry: 7,
      disorder: 0.4,
      randomSeed: 0.11,
    });
    expect(a).toEqual(b);
    expect(a.some((o) => Math.abs(o - 0.2) > 0.01)).toBe(true);
  });
});

describe("buildGridLines / buildMultigridScene", () => {
  it("builds lines for N=5", () => {
    const lines = buildGridLines({ ...DEFAULT_RECIPE, symmetry: 5, radius: 40 });
    expect(lines.length).toBeGreaterThan(10);
  });

  it("produces finite dual tiles for Penrose-like settings", () => {
    const scene = buildMultigridScene(
      { ...DEFAULT_RECIPE, symmetry: 5, pattern: 0.2, radius: 50, zoom: 1 },
      600,
      600
    );
    expect(scene.tiles.length).toBeGreaterThan(5);
    for (const tile of scene.tiles) {
      expect(tile.dualPts.length).toBeGreaterThanOrEqual(3);
      expect(Number.isFinite(tile.area)).toBe(true);
    }
  });

  it("Dense 13-fold preset yields tiles", () => {
    const dense = MULTIGRID_PRESETS.find((p) => p.label === "Dense")!;
    const scene = buildMultigridScene(
      normalizeRecipe({ ...DEFAULT_RECIPE, ...dense.recipe, radius: 60 }),
      700,
      500
    );
    expect(scene.tiles.length).toBeGreaterThan(10);
    expect(uniqueOrientationKeys(scene.tiles).length).toBeGreaterThan(1);
  });
});

describe("blendRecipes", () => {
  it("lerps continuous params and snaps symmetry", () => {
    const a = normalizeRecipe({ symmetry: 5, pattern: 0, rotate: 0, pan: 0 });
    const b = normalizeRecipe({ symmetry: 13, pattern: 1, rotate: 90, pan: 0.5 });
    const mid = blendRecipes(a, b, 0.5);
    expect(mid.symmetry).toBe(13);
    expect(mid.pattern).toBeCloseTo(0.5);
    expect(mid.rotate).toBeCloseTo(45);
  });
});
