import { describe, it, expect } from "vitest";
import {
  blendRecipes,
  clampFolds,
  evaluateField,
  evaluateFieldMorph,
  normalizeRecipe,
  QUASIPERIODIC_PRESETS,
  randomRecipe,
  waveAngle,
} from "@/lib/quasiperiodic";

describe("clampFolds / normalizeRecipe", () => {
  it("clamps folds to 3..12", () => {
    expect(clampFolds(1)).toBe(3);
    expect(clampFolds(20)).toBe(12);
    expect(clampFolds(5.4)).toBe(5);
  });

  it("normalizes partial recipes", () => {
    const r = normalizeRecipe({ folds: 99, frequency: -1, phase: 0 });
    expect(r.folds).toBe(12);
    expect(r.frequency).toBe(0.5);
  });
});

describe("waveAngle", () => {
  it("spaces angles evenly over π", () => {
    expect(waveAngle(0, 4)).toBeCloseTo(0);
    expect(waveAngle(1, 4)).toBeCloseTo(Math.PI / 4);
    expect(waveAngle(2, 4)).toBeCloseTo(Math.PI / 2);
  });
});

describe("evaluateField", () => {
  it("is finite and larger near constructive interference at origin for even folds", () => {
    const four = evaluateField(0, 0, { folds: 4, frequency: 3, phase: 0 });
    expect(four).toBeCloseTo(4);

    const five = evaluateField(0, 0, { folds: 5, frequency: 3, phase: 0 });
    expect(five).toBeCloseTo(5);
  });

  it("changes with position for N=5", () => {
    const a = evaluateField(0.1, 0.2, { folds: 5, frequency: 4, phase: 0 });
    const b = evaluateField(0.3, -0.1, { folds: 5, frequency: 4, phase: 0 });
    expect(a).not.toBeCloseTo(b);
  });
});

describe("evaluateFieldMorph", () => {
  it("returns endpoint fields at t=0 and t=1", () => {
    const a = { folds: 4, frequency: 3, phase: 0 };
    const b = { folds: 7, frequency: 5, phase: 1 };
    const x = 0.2;
    const y = -0.15;
    expect(evaluateFieldMorph(x, y, a, b, 0)).toBeCloseTo(evaluateField(x, y, a));
    expect(evaluateFieldMorph(x, y, a, b, 1)).toBeCloseTo(evaluateField(x, y, b));
  });
});

describe("blendRecipes", () => {
  it("lerps frequency and snaps folds by half", () => {
    const a = { folds: 4, frequency: 2, phase: 0 };
    const b = { folds: 8, frequency: 6, phase: 2 };
    const mid = blendRecipes(a, b, 0.5);
    expect(mid.folds).toBe(8);
    expect(mid.frequency).toBeCloseTo(4);
    expect(mid.phase).toBeCloseTo(1);
  });
});

describe("presets and random", () => {
  it("exposes five curated presets with valid folds", () => {
    expect(QUASIPERIODIC_PRESETS).toHaveLength(5);
    for (const p of QUASIPERIODIC_PRESETS) {
      expect(p.recipe.folds).toBeGreaterThanOrEqual(3);
      expect(p.recipe.folds).toBeLessThanOrEqual(12);
    }
  });

  it("randomRecipe stays in range", () => {
    for (let i = 0; i < 20; i++) {
      const r = randomRecipe();
      expect(r.folds).toBeGreaterThanOrEqual(3);
      expect(r.folds).toBeLessThanOrEqual(12);
      expect(r.frequency).toBeGreaterThanOrEqual(0.5);
      expect(r.frequency).toBeLessThanOrEqual(16);
    }
  });
});
