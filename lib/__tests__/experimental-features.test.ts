import { describe, it, expect } from "vitest";
import {
  DEFAULT_EXPERIMENTAL_FEATURES,
  isExperimentalAmbientKind,
  isExperimentalToolHref,
  normalizeExperimentalFeatures,
} from "@/lib/experimental-features";

describe("normalizeExperimentalFeatures", () => {
  it("defaults to disabled", () => {
    expect(normalizeExperimentalFeatures({})).toEqual(
      DEFAULT_EXPERIMENTAL_FEATURES
    );
    expect(DEFAULT_EXPERIMENTAL_FEATURES.enabled).toBe(false);
  });

  it("keeps a boolean enabled flag", () => {
    expect(normalizeExperimentalFeatures({ enabled: true }).enabled).toBe(true);
    expect(normalizeExperimentalFeatures({ enabled: false }).enabled).toBe(
      false
    );
  });

  it("ignores non-boolean enabled values", () => {
    expect(
      normalizeExperimentalFeatures({ enabled: "yes" as unknown as boolean })
        .enabled
    ).toBe(false);
  });
});

describe("experimental catalogs", () => {
  it("marks Multigrid Lab as experimental", () => {
    expect(isExperimentalToolHref("/tools/multigrid")).toBe(true);
    expect(isExperimentalToolHref("/tools/chladni")).toBe(false);
  });

  it("marks multigrid ambient kind as experimental", () => {
    expect(isExperimentalAmbientKind("multigrid")).toBe(true);
    expect(isExperimentalAmbientKind("chladni")).toBe(false);
  });
});
