import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  normalizeStoredBlock,
  blockMigrators,
} from "@/lib/feature-blocks/schemas";
import { featureRegistry } from "@/lib/feature-blocks/registry";
import { blockConfigVersions } from "@/lib/feature-blocks/versions";

const TYPES = Object.keys(featureRegistry);

describe("block config version plumbing", () => {
  it("declares a configVersion on every registry entry", () => {
    for (const def of Object.values(featureRegistry)) {
      expect(def.configVersion).toEqual(blockConfigVersions[def.type]);
      expect(def.configVersion).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps the versions table in step with the registry", () => {
    expect(Object.keys(blockConfigVersions).sort()).toEqual([...TYPES].sort());
  });

  it("ships every block at version 1 this phase", () => {
    for (const type of TYPES) {
      expect(blockConfigVersions[type]).toBe(1);
    }
  });
});

describe("normalizeStoredBlock version handling", () => {
  const raw = (version: unknown, config: unknown = {}) => ({
    id: "b1",
    type: "metronome",
    version,
    config,
  });

  // Test-only migration chain; `blockMigrators` ships empty. The steps
  // produce old-shape -> new-shape config; the block's normalizer still
  // runs afterwards, so steps must emit fields the normalizer keeps.
  const fakeChain = {
    1: (config: Record<string, unknown>) => ({ bpm: config.old }),
  };

  beforeEach(() => {
    blockConfigVersions.metronome = 2;
    blockMigrators.metronome = fakeChain;
  });

  afterEach(() => {
    blockConfigVersions.metronome = 1;
    delete blockMigrators.metronome;
  });

  it("passes a block stored at the current version through unchanged", () => {
    const out = normalizeStoredBlock(raw(2, { bpm: 96 }));
    expect(out).not.toBeNull();
    expect(out?.version).toBe(2);
    expect(out?.config).toEqual(
      featureRegistry.metronome.normalizeConfig({ bpm: 96 })
    );
    expect(out?.config).toMatchObject({ bpm: 96 });
  });

  it("defaults a missing version to the current version", () => {
    const out = normalizeStoredBlock({ id: "b1", type: "metronome", config: {} });
    expect(out?.version).toBe(2);
  });

  it("migrates a below-current block with a registered migrator, then stamps the current version", () => {
    const out = normalizeStoredBlock(raw(1, { old: 96 }));
    expect(out?.version).toBe(2);
    // The migrator's `renamed` bpm survived the post-migration normalize.
    expect(out?.config).toMatchObject({ bpm: 96 });
  });

  it("chains multi-step migrations in order", () => {
    blockConfigVersions.metronome = 3;
    blockMigrators.metronome = {
      ...fakeChain,
      2: (config) => ({ ...config, beatsPerBar: 5 }),
    };
    const out = normalizeStoredBlock(raw(1, { old: 96 }));
    expect(out?.version).toBe(3);
    expect(out?.config).toMatchObject({ bpm: 96, beatsPerBar: 5 });
  });

  it("keeps a below-current block with no migrator, stamped to the current version", () => {
    // No registered chain: the normalizer applies defaults and the block
    // stays rather than being dropped.
    const out = normalizeStoredBlock(raw(1, { nonsense: true }));
    expect(out).not.toBeNull();
    expect(out?.version).toBe(2);
    expect(out?.config).toEqual(
      featureRegistry.metronome.normalizeConfig({ nonsense: true })
    );
  });

  it("keeps a block stored above the current version, without dropping it", () => {
    const out = normalizeStoredBlock(raw(999, { bpm: 120 }));
    expect(out).not.toBeNull();
    expect(out?.version).toBe(999);
    expect(out?.config).toEqual(
      featureRegistry.metronome.normalizeConfig({ bpm: 120 })
    );
  });

  it("defaults a non-integer version", () => {
    const out = normalizeStoredBlock(raw(1.5));
    expect(out?.version).toBe(2);
  });
});
