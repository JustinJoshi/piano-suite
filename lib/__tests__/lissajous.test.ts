import { describe, it, expect } from "vitest";
import {
  LISSAJOUS_PRESETS,
  gcd,
  reduceRatio,
  intervalName,
  formatRatioLabel,
  pointAt,
  lerpParams,
  randomRatio,
  clampParams,
} from "@/lib/lissajous";

describe("LISSAJOUS_PRESETS", () => {
  it("has eight named interval presets with valid ratios", () => {
    expect(LISSAJOUS_PRESETS).toHaveLength(8);
    for (const preset of LISSAJOUS_PRESETS) {
      expect(preset.label.length).toBeGreaterThan(0);
      expect(preset.interval.length).toBeGreaterThan(0);
      expect(preset.a).toBeGreaterThanOrEqual(1);
      expect(preset.b).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(preset.delta)).toBe(true);
    }
  });

  it("uses unique labels", () => {
    const labels = LISSAJOUS_PRESETS.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("gcd", () => {
  it("computes the greatest common divisor", () => {
    expect(gcd(12, 8)).toBe(4);
    expect(gcd(7, 5)).toBe(1);
    expect(gcd(9, 3)).toBe(3);
    expect(gcd(0, 5)).toBe(5);
  });
});

describe("reduceRatio", () => {
  it("reduces integer ratios to lowest terms", () => {
    expect(reduceRatio(6, 4)).toEqual([3, 2]);
    expect(reduceRatio(8, 4)).toEqual([2, 1]);
    expect(reduceRatio(5, 4)).toEqual([5, 4]);
  });

  it("rounds and floors to at least 1", () => {
    expect(reduceRatio(0.4, 2.6)).toEqual([1, 3]);
  });
});

describe("intervalName / formatRatioLabel", () => {
  it("names curated ratios", () => {
    expect(intervalName(3, 2)).toBe("Perfect fifth");
    expect(intervalName(6, 4)).toBe("Perfect fifth");
    expect(formatRatioLabel(3, 2)).toBe("3:2 — Perfect fifth");
  });

  it("falls back for unknown ratios", () => {
    expect(intervalName(9, 4)).toBe("Custom ratio");
    expect(formatRatioLabel(9, 4)).toBe("9:4 — Custom ratio");
  });
});

describe("pointAt", () => {
  it("returns (1, 0) at t = 0 with δ = π/2", () => {
    const [x, y] = pointAt(0, 1, 1, Math.PI / 2);
    expect(x).toBeCloseTo(1, 10);
    expect(y).toBeCloseTo(0, 10);
  });

  it("returns (0, 0) at t = 0 with δ = 0", () => {
    expect(pointAt(0, 3, 2, 0)).toEqual([0, 0]);
  });

  it("respects frequency multipliers", () => {
    const [x] = pointAt(Math.PI / 2, 2, 1, 0);
    // sin(2 · π/2) = sin(π) = 0
    expect(x).toBeCloseTo(0, 10);
  });
});

describe("lerpParams", () => {
  it("returns endpoints at t = 0 and t = 1", () => {
    const from = { a: 1, b: 1, delta: 0 };
    const to = { a: 3, b: 2, delta: Math.PI };
    expect(lerpParams(from, to, 0)).toEqual(from);
    expect(lerpParams(from, to, 1)).toEqual(to);
  });

  it("interpolates midpoints and clamps t", () => {
    const mid = lerpParams(
      { a: 0, b: 0, delta: 0 },
      { a: 4, b: 2, delta: 2 },
      0.5
    );
    expect(mid).toEqual({ a: 2, b: 1, delta: 1 });
    expect(lerpParams({ a: 0, b: 0, delta: 0 }, { a: 4, b: 2, delta: 2 }, -1)).toEqual({
      a: 0,
      b: 0,
      delta: 0,
    });
  });
});

describe("randomRatio", () => {
  it("returns frequencies in [1, max] with finite phase", () => {
    for (let i = 0; i < 40; i++) {
      const p = randomRatio(8);
      expect(p.a).toBeGreaterThanOrEqual(1);
      expect(p.a).toBeLessThanOrEqual(8);
      expect(p.b).toBeGreaterThanOrEqual(1);
      expect(p.b).toBeLessThanOrEqual(8);
      expect(Number.isFinite(p.delta)).toBe(true);
      expect(p.delta).toBeGreaterThanOrEqual(0);
      expect(p.delta).toBeLessThanOrEqual(Math.PI * 2 + 1e-9);
    }
  });
});

describe("clampParams", () => {
  it("clamps frequencies and wraps phase", () => {
    const wrapped = clampParams({ a: 0, b: 20, delta: -0.1 }, 1, 12);
    expect(wrapped.a).toBe(1);
    expect(wrapped.b).toBe(12);
    expect(wrapped.delta).toBeCloseTo(Math.PI * 2 - 0.1, 5);

    expect(clampParams({ a: 3.4, b: 2.6, delta: Math.PI }, 1, 12)).toEqual({
      a: 3,
      b: 3,
      delta: Math.PI,
    });
  });
});
