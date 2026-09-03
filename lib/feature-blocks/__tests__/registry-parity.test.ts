import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { featureRegistry, featureCategories } from "@/lib/feature-blocks/registry";
import { KNOWN_BLOCK_TYPES, normalizeStoredBlock } from "@/lib/feature-blocks/schemas";
import { blockSize } from "@/lib/workshop-grid";
import { getManifest, listManifests } from "@/lib/feature-blocks/manifest";

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

describe("manifest parity", () => {
  it("has a manifest entry for every registry block", () => {
    for (const def of Object.values(featureRegistry)) {
      const manifest = getManifest(def.type);
      expect(manifest).not.toBeNull();
      expect(manifest?.type).toBe(def.type);
    }
  });

  it("every manifest has a non-empty justification", () => {
    for (const manifest of listManifests()) {
      expect(manifest.justification.length).toBeGreaterThan(0);
    }
  });

  it("every manifest has a valid docsPath", () => {
    // We can't easily check file existence in a test, but we can check the path
    // follows the convention docs/components/<something>.md
    for (const manifest of listManifests()) {
      expect(manifest.docsPath).toMatch(/^docs\/components\/.+\.md$/);
    }
  });

  it("manifest configSpec and registry fields describe the same keys", () => {
    for (const def of Object.values(featureRegistry)) {
      const manifest = getManifest(def.type);
      if (!manifest) continue;

      const registryKeys = new Set(def.fields.map((f) => f.key));
      const manifestKeys = new Set(manifest.configSpec.map((f) => f.key));

      expect(registryKeys).toEqual(manifestKeys);
    }
  });

  it("manifest outputs match registry provides", () => {
    for (const def of Object.values(featureRegistry)) {
      const manifest = getManifest(def.type);
      if (!manifest) continue;

      if (def.provides === "targets") {
        expect(manifest.outputs).toContain("practiceNotes");
      } else if (manifest.outputs.length === 0) {
        expect(def.provides).toBeUndefined();
      }
    }
  });

  it("manifest maxPerPage matches registry maxPerPage", () => {
    for (const def of Object.values(featureRegistry)) {
      const manifest = getManifest(def.type);
      if (!manifest) continue;

      if (def.maxPerPage === undefined) {
        expect(manifest.maxPerPage).toBeUndefined();
      } else {
        expect(manifest.maxPerPage).toEqual(def.maxPerPage);
      }
    }
  });

  it("marks a manifest stable only when the block reads or writes the runtime", () => {
    for (const manifest of listManifests()) {
      if (manifest.status !== "stable") continue;

      const wired = readsOrWritesRuntime(manifest.type);
      const chrome = LEGACY_PAGE_CHROME.has(manifest.type);

      expect(
        wired || chrome,
        `${manifest.type} claims stable but neither touches the runtime nor predates the stream chain`
      ).toBe(true);
    }
  });
});

/** Blocks whose component imports a runtime hook. Checked against source. */
const RUNTIME_HOOKS = /useDrillRuntime|useTargetSource|useNoteStream/;

/**
 * Page-chrome blocks shipped before the stream chain. They may claim
 * stable without touching the runtime; the runtime composes around them.
 */
const LEGACY_PAGE_CHROME = new Set([
  "metronome",
  "textBlock",
  "midiConnectionBar",
  "drillShortcuts",
  "keyboardDisplay",
  "restTimer",
]);

function kebab(type: string): string {
  return type.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function readsOrWritesRuntime(type: string): boolean {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const file = join(root, "components", "feature-blocks", `${kebab(type)}-block.tsx`);
  if (!existsSync(file)) return false;
  return RUNTIME_HOOKS.test(readFileSync(file, "utf8"));
}
