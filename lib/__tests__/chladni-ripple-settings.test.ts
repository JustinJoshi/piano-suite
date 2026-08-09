import { describe, it, expect } from "vitest";
import {
  DEFAULT_RIPPLE_PARAMS,
  AMBIENT_RIPPLE_PARAMS,
  normalizeChladniRippleParams,
} from "@/lib/chladni-ripple-settings";

describe("DEFAULT_RIPPLE_PARAMS", () => {
  it("has expected lab defaults", () => {
    expect(DEFAULT_RIPPLE_PARAMS.decayMs).toBe(1200);
    expect(DEFAULT_RIPPLE_PARAMS.zoom).toBe(2.2);
    expect(DEFAULT_RIPPLE_PARAMS.secondaryOffset).toEqual([1, 2]);
  });

  it("ambient params are softer than lab defaults", () => {
    expect(AMBIENT_RIPPLE_PARAMS.baseIntensity).toBeLessThan(
      DEFAULT_RIPPLE_PARAMS.baseIntensity
    );
    expect(AMBIENT_RIPPLE_PARAMS.colorSoftness).toBeGreaterThan(
      DEFAULT_RIPPLE_PARAMS.colorSoftness
    );
  });
});

describe("normalizeChladniRippleParams", () => {
  it("returns defaults for empty input", () => {
    expect(normalizeChladniRippleParams({})).toEqual(DEFAULT_RIPPLE_PARAMS);
    expect(normalizeChladniRippleParams(null)).toEqual(DEFAULT_RIPPLE_PARAMS);
  });

  it("preserves valid overrides", () => {
    const params = normalizeChladniRippleParams({
      decayMs: 2000,
      zoom: 3,
      secondaryBlend: 0.4,
    });
    expect(params.decayMs).toBe(2000);
    expect(params.zoom).toBe(3);
    expect(params.secondaryBlend).toBe(0.4);
  });

  it("clamps out-of-range values", () => {
    const params = normalizeChladniRippleParams({
      decayMs: 50,
      octaveComplexity: -1,
      baseIntensity: 5,
      zoom: 20,
      secondaryBlend: 2,
    });
    expect(params.decayMs).toBe(100);
    expect(params.octaveComplexity).toBe(0);
    expect(params.baseIntensity).toBe(2);
    expect(params.zoom).toBe(8);
    expect(params.secondaryBlend).toBe(0.8);
  });

  it("fixes invalid secondary offset", () => {
    const params = normalizeChladniRippleParams({
      secondaryOffset: ["x", 99] as unknown as [number, number],
    });
    expect(params.secondaryOffset).toEqual([1, 2]);
  });

  it("clamps secondary offset range", () => {
    const params = normalizeChladniRippleParams({
      secondaryOffset: [-20, 20],
    });
    expect(params.secondaryOffset).toEqual([-10, 10]);
  });
});
