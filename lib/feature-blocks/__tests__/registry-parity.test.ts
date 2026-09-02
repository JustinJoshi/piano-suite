import { describe, it, expect } from "vitest";
import { featureRegistry, featureCategories } from "@/lib/feature-blocks/registry";
import { KNOWN_BLOCK_TYPES, normalizeStoredBlock } from "@/lib/feature-blocks/schemas";
import { blockSize } from "@/lib/workshop-grid";

/**
 * The registry (client) and `schemas.ts` (Convex-bundled) keep two hand-written
 * lists of block types. Adding a block to one and forgetting the other means a
 * page saves fine and comes back empty, so CI checks they agree.
 */
describe("block registry / schema parity", () => {
  const registryTypes = Object.keys(featureRegistry).sort();

  it("registers a normalizer for every block in the registry", () => {
    expect([...KNOWN_BLOCK_TYPES].sort()).toEqual(registryTypes);
  });

  it("keys every registry entry by its own type", () => {
    for (const [key, def] of Object.entries(featureRegistry)) {
      expect(def.type).toBe(key);
    }
  });

  it("uses a declared category for every block", () => {
    const categories = new Set(featureCategories.map((c) => c.id));
    for (const def of Object.values(featureRegistry)) {
      expect(categories.has(def.category)).toBe(true);
    }
  });

  it("gives every block a label and a description", () => {
    for (const def of Object.values(featureRegistry)) {
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.description.length).toBeGreaterThan(0);
    }
  });

  it("round-trips every block's default config through storage validation", () => {
    for (const def of Object.values(featureRegistry)) {
      const stored = normalizeStoredBlock({
        id: `test-${def.type}`,
        type: def.type,
        version: 1,
        config: def.defaultConfig,
      });

      expect(stored).not.toBeNull();
      expect(stored?.config).toEqual(def.defaultConfig);
    }
  });

  it("normalizes junk config back to the block's defaults", () => {
    for (const def of Object.values(featureRegistry)) {
      expect(def.normalizeConfig({ nonsense: true })).toEqual(def.defaultConfig);
      expect(def.normalizeConfig(null)).toEqual(def.defaultConfig);
      expect(def.normalizeConfig("not an object")).toEqual(def.defaultConfig);
    }
  });

  it("only exposes settings fields the config actually has", () => {
    for (const def of Object.values(featureRegistry)) {
      for (const field of def.fields) {
        expect(Object.keys(def.defaultConfig)).toContain(field.key);
      }
    }
  });

  it("never names a config field after a reserved React prop", () => {
    // `FeatureRenderer` spreads config straight onto the component, so a
    // field called `key` (or `ref`) would be swallowed by React and the block
    // would silently render with an undefined value.
    const reserved = ["key", "ref", "children"];
    for (const def of Object.values(featureRegistry)) {
      for (const name of Object.keys(def.defaultConfig)) {
        expect(reserved).not.toContain(name);
      }
    }
  });

  it("gives every block a sane default grid size", () => {
    for (const def of Object.values(featureRegistry)) {
      const size = blockSize({ type: def.type });
      expect(size.w).toBeGreaterThanOrEqual(1);
      expect(size.w).toBeLessThanOrEqual(4);
      expect(size.h).toBeGreaterThanOrEqual(1);
    }
  });
});
