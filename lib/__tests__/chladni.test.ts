import { describe, it, expect } from "vitest";
import {
  chladni,
  chladniComplex,
  buildModeSequence,
  smoothstep,
  lerp,
  cssColorToRgb,
  clamp,
  randomMode,
  mixRgb,
} from "@/lib/chladni";

describe("chladni", () => {
  it("returns zero at the origin for any mode", () => {
    for (const [m, n] of [
      [2, 3],
      [5, 7],
      [8, 11],
    ] as [number, number][]) {
      expect(chladni(0, 0, m, n)).toBe(0);
    }
  });

  it("is symmetric under swapping axes and modes", () => {
    const cases: [number, number, number, number][] = [
      [0.25, 0.75, 4, 5],
      [0.1, 0.9, 7, 3],
      [-0.4, 0.6, 6, 9],
    ];
    for (const [x, y, m, n] of cases) {
      expect(chladni(x, y, m, n)).toBeCloseTo(chladni(y, x, n, m), 10);
    }
  });

  it("returns distinct non-zero values away from the origin", () => {
    const v = chladni(0.3, 0.4, 4, 5);
    expect(v).not.toBe(0);
    expect(Number.isFinite(v)).toBe(true);
  });
});

describe("chladniComplex", () => {
  it("returns the first mode when blend is 0", () => {
    const x = 0.3;
    const y = 0.4;
    expect(chladniComplex(x, y, 4, 5, 6, 7, 0)).toBeCloseTo(
      chladni(x, y, 4, 5),
      10
    );
  });

  it("returns the second mode when blend is 1", () => {
    const x = 0.3;
    const y = 0.4;
    expect(chladniComplex(x, y, 4, 5, 6, 7, 1)).toBeCloseTo(
      chladni(x, y, 6, 7),
      10
    );
  });

  it("interpolates linearly between modes", () => {
    const x = 0.3;
    const y = 0.4;
    const a = chladni(x, y, 4, 5);
    const b = chladni(x, y, 6, 7);
    expect(chladniComplex(x, y, 4, 5, 6, 7, 0.5)).toBeCloseTo(
      (a + b) / 2,
      10
    );
  });
});

describe("buildModeSequence", () => {
  it("returns pairs within the requested max mode", () => {
    const seq = buildModeSequence(8);
    for (const [m, n] of seq) {
      expect(m).toBeLessThanOrEqual(8);
      expect(n).toBeLessThanOrEqual(8);
      expect(m).not.toBe(n);
    }
  });

  it("is deterministic in bounds but shuffled", () => {
    const a = buildModeSequence(8);
    const b = buildModeSequence(8);
    expect(a.length).toBe(b.length);
    expect(a).not.toEqual(b);
  });

  it("is empty when maxMode is below the smallest pair", () => {
    expect(buildModeSequence(3)).toEqual([]);
  });
});

describe("smoothstep", () => {
  it("maps 0 to 0 and 1 to 1", () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
  });

  it("has zero derivatives at the endpoints", () => {
    const delta = 1e-6;
    const left = smoothstep(delta) - smoothstep(0);
    const right = smoothstep(1) - smoothstep(1 - delta);
    expect(Math.abs(left)).toBeLessThan(delta * 2);
    expect(Math.abs(right)).toBeLessThan(delta * 2);
  });
});

describe("lerp", () => {
  it("interpolates between two values", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(10, 20, 0.5)).toBe(15);
  });
});

describe("cssColorToRgb", () => {
  it("converts 6-digit hex to normalized RGB", () => {
    expect(cssColorToRgb("#c9a227")).toEqual([
      0.788235294117647,
      0.6352941176470588,
      0.15294117647058825,
    ]);
  });

  it("converts 3-digit hex to normalized RGB", () => {
    expect(cssColorToRgb("#abc")).toEqual([
      0.6666666666666666,
      0.7333333333333333,
      0.8,
    ]);
  });

  it("converts rgb() strings", () => {
    expect(cssColorToRgb("rgb(201, 162, 39)")).toEqual([
      0.788235294117647,
      0.6352941176470588,
      0.15294117647058825,
    ]);
  });

  it("converts rgba() strings ignoring alpha", () => {
    expect(cssColorToRgb("rgba(201, 162, 39, 0.5)")).toEqual([
      0.788235294117647,
      0.6352941176470588,
      0.15294117647058825,
    ]);
  });

  it("returns black for unsupported strings", () => {
    expect(cssColorToRgb("not-a-color")).toEqual([0, 0, 0]);
  });
});

describe("mixRgb", () => {
  it("returns the first color when t is 0", () => {
    expect(mixRgb([0, 0, 0], [1, 1, 1], 0)).toEqual([0, 0, 0]);
  });

  it("returns the second color when t is 1", () => {
    expect(mixRgb([0, 0, 0], [1, 0.5, 0.25], 1)).toEqual([1, 0.5, 0.25]);
  });

  it("interpolates midpoints and clamps t", () => {
    expect(mixRgb([0, 0, 0], [1, 1, 1], 0.5)).toEqual([0.5, 0.5, 0.5]);
    expect(mixRgb([0, 0, 0], [1, 1, 1], -1)).toEqual([0, 0, 0]);
    expect(mixRgb([0, 0, 0], [1, 1, 1], 2)).toEqual([1, 1, 1]);
  });
});

describe("clamp", () => {
  it("clamps values to the [min, max] range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe("randomMode", () => {
  it("returns distinct mode pairs within the requested max", () => {
    for (let i = 0; i < 20; i++) {
      const [m, n] = randomMode(12);
      expect(m).toBeGreaterThanOrEqual(2);
      expect(m).toBeLessThanOrEqual(12);
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThanOrEqual(12);
      expect(m).not.toBe(n);
    }
  });

  it("returns a safe default pair when max is too small", () => {
    const [m, n] = randomMode(1);
    expect(m).not.toBe(n);
    expect(m).toBeGreaterThanOrEqual(2);
    expect(n).toBeGreaterThanOrEqual(2);
  });
});
