import { describe, it, expect } from "vitest";
import {
  JULIA_PRESETS,
  complexMod2,
  juliaIterate,
  juliaEscapeIterations,
  juliaSmoothEscape,
  lerpComplex,
  randomC,
  clampComplex,
} from "@/lib/julia";

describe("JULIA_PRESETS", () => {
  it("has five named presets with finite c values", () => {
    expect(JULIA_PRESETS).toHaveLength(5);
    for (const preset of JULIA_PRESETS) {
      expect(preset.label.length).toBeGreaterThan(0);
      expect(Number.isFinite(preset.c[0])).toBe(true);
      expect(Number.isFinite(preset.c[1])).toBe(true);
      expect(Math.abs(preset.c[0])).toBeLessThanOrEqual(2);
      expect(Math.abs(preset.c[1])).toBeLessThanOrEqual(2);
    }
  });

  it("uses unique labels", () => {
    const labels = JULIA_PRESETS.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("complexMod2", () => {
  it("returns the squared modulus", () => {
    expect(complexMod2([3, 4])).toBe(25);
    expect(complexMod2([0, 0])).toBe(0);
  });
});

describe("juliaIterate", () => {
  it("computes z² + c", () => {
    // (1+2i)² + (0.1+0.2i) = -3+4i + 0.1+0.2i = -2.9+4.2i
    expect(juliaIterate([1, 2], [0.1, 0.2])).toEqual([-2.9, 4.2]);
  });

  it("fixes the origin at c", () => {
    expect(juliaIterate([0, 0], [-0.75, 0.11])).toEqual([-0.75, 0.11]);
  });
});

describe("juliaEscapeIterations", () => {
  it("returns 0 when the starting point already escapes", () => {
    expect(juliaEscapeIterations([10, 0], [0, 0], 100, 4)).toBe(0);
  });

  it("returns maxIterations for the origin when |c| is small", () => {
    // c = 0 → z stays at 0 forever
    expect(juliaEscapeIterations([0, 0], [0, 0], 50, 4)).toBe(50);
  });

  it("escapes for classic Dust preset from far-field points", () => {
    const c = JULIA_PRESETS.find((p) => p.label === "Dust")!.c;
    const iters = juliaEscapeIterations([1.5, 1.5], c, 100, 4);
    expect(iters).toBeLessThan(100);
    expect(iters).toBeGreaterThanOrEqual(0);
  });
});

describe("juliaSmoothEscape", () => {
  it("returns maxIterations for bounded orbits", () => {
    expect(juliaSmoothEscape([0, 0], [0, 0], 40, 4)).toBe(40);
  });

  it("returns a continuous value less than maxIterations for escaping points", () => {
    const c = JULIA_PRESETS.find((p) => p.label === "Seahorse")!.c;
    const smooth = juliaSmoothEscape([1.2, 0.8], c, 100, 4);
    const discrete = juliaEscapeIterations([1.2, 0.8], c, 100, 4);
    expect(smooth).toBeLessThan(100);
    expect(Number.isFinite(smooth)).toBe(true);
    // Smooth correction can sit slightly below the discrete step.
    expect(Math.abs(smooth - discrete)).toBeLessThan(2);
  });
});

describe("lerpComplex", () => {
  it("returns endpoints at t = 0 and t = 1", () => {
    expect(lerpComplex([-1, 0], [1, 2], 0)).toEqual([-1, 0]);
    expect(lerpComplex([-1, 0], [1, 2], 1)).toEqual([1, 2]);
  });

  it("interpolates midpoints and clamps t", () => {
    expect(lerpComplex([0, 0], [2, 4], 0.5)).toEqual([1, 2]);
    expect(lerpComplex([0, 0], [2, 4], -1)).toEqual([0, 0]);
    expect(lerpComplex([0, 0], [2, 4], 2)).toEqual([2, 4]);
  });
});

describe("randomC", () => {
  it("returns finite pairs within the requested radius", () => {
    for (let i = 0; i < 30; i++) {
      const c = randomC(1.2);
      expect(Number.isFinite(c[0])).toBe(true);
      expect(Number.isFinite(c[1])).toBe(true);
      // randomC rounds components to 3 decimals and intentionally biases
      // slightly outward, so the magnitude can exceed the radius by up to
      // ~7e-4. Allow that rounding slack, nothing more.
      expect(Math.hypot(c[0], c[1])).toBeLessThanOrEqual(1.2 + 1e-3);
    }
  });
});

describe("clampComplex", () => {
  it("clamps each component independently", () => {
    expect(clampComplex([-3, 5], -2, 2)).toEqual([-2, 2]);
    expect(clampComplex([0.5, -0.5], -2, 2)).toEqual([0.5, -0.5]);
  });
});
