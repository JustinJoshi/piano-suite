import { describe, it, expect } from "vitest";
import {
  drillShortcutsDefaultConfig,
  normalizeDrillShortcutsConfig,
  drillShortcutsFields,
} from "@/lib/feature-blocks/drill-shortcuts/config";

describe("drillShortcuts config", () => {
  it("has an empty default config", () => {
    expect(drillShortcutsDefaultConfig).toEqual({});
  });

  it("normalizes any input to an empty config", () => {
    expect(normalizeDrillShortcutsConfig(undefined)).toEqual({});
    expect(normalizeDrillShortcutsConfig({ bpm: "garbage", nested: [1, 2] })).toEqual({});
  });

  it("exposes no settings fields", () => {
    expect(drillShortcutsFields).toEqual([]);
  });
});
