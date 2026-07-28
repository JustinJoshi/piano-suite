import { describe, it, expect } from "vitest";
import {
  defaultPatternName,
  isLabPatternTool,
  normalizeChladniLabParams,
  normalizeJuliaLabParams,
  normalizeLissajousLabParams,
  type ChladniLabParams,
  type JuliaLabParams,
  type LissajousLabParamsSnapshot,
} from "../lab-patterns";

const chladniFallback: ChladniLabParams = {
  mode: [5, 7],
  nextMode: [7, 9],
  morph: 0.25,
  autoMorph: true,
  morphSpeed: 8,
  lineThickness: 30,
  zoom: 2.33,
  secondaryOffset: [1, 2],
  secondaryBlend: 0.15,
  secondarySpeed: 1,
  secondaryMotion: 2,
  breathe: 0.2,
  timeScale: 1,
};

const juliaFallback: JuliaLabParams = {
  c: [-0.75, 0.11],
  nextC: [-0.12, 0.77],
  morph: 0,
  autoMorph: true,
  morphSpeed: 10,
  zoom: 1.2,
  maxIterations: 128,
  escapeRadius: 4,
  colorSoftness: 0,
  timeScale: 1,
};

const lissajousFallback: LissajousLabParamsSnapshot = {
  params: { a: 3, b: 2, delta: Math.PI / 2 },
  nextParams: { a: 4, b: 3, delta: 0 },
  morph: 0.1,
  autoMorph: false,
  morphSpeed: 10,
  sweepSpeed: 1.2,
  trailFade: 0.06,
  lineThickness: 2,
  zoom: 0.85,
  colorSoftness: 0,
};

describe("lab-patterns", () => {
  it("recognizes known lab tool ids", () => {
    expect(isLabPatternTool("chladni")).toBe(true);
    expect(isLabPatternTool("julia")).toBe(true);
    expect(isLabPatternTool("lissajous")).toBe(true);
    expect(isLabPatternTool("chord-drill")).toBe(false);
  });

  it("builds a default pattern name", () => {
    expect(defaultPatternName()).toMatch(/^Pattern \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });

  it("normalizes chladni params and falls back on bad values", () => {
    const next = normalizeChladniLabParams(
      {
        mode: [8, 11],
        morph: 0.5,
        autoMorph: false,
        zoom: "nope",
      },
      chladniFallback
    );
    expect(next.mode).toEqual([8, 11]);
    expect(next.morph).toBe(0.5);
    expect(next.autoMorph).toBe(false);
    expect(next.zoom).toBe(chladniFallback.zoom);
    expect(next.nextMode).toEqual(chladniFallback.nextMode);
  });

  it("normalizes julia params", () => {
    const next = normalizeJuliaLabParams(
      { c: [0.285, 0.01], maxIterations: 200 },
      juliaFallback
    );
    expect(next.c).toEqual([0.285, 0.01]);
    expect(next.maxIterations).toBe(200);
    expect(next.nextC).toEqual(juliaFallback.nextC);
  });

  it("normalizes lissajous params", () => {
    const next = normalizeLissajousLabParams(
      {
        params: { a: 5, b: 4, delta: 1 },
        trailFade: 0.1,
      },
      lissajousFallback
    );
    expect(next.params).toEqual({ a: 5, b: 4, delta: 1 });
    expect(next.trailFade).toBe(0.1);
    expect(next.nextParams).toEqual(lissajousFallback.nextParams);
  });
});
