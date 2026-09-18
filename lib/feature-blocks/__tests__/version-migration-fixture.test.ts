import { describe, it, expect, afterEach } from "vitest";
import {
  normalizeStoredBlock,
  blockMigrators,
} from "@/lib/feature-blocks/schemas";
import { blockConfigVersions } from "@/lib/feature-blocks/versions";

/**
 * Synthetic two-version fixture proving the migration chain carries data.
 * Nothing here ships: the version bump and migrator are registered inside the
 * test and reverted afterwards so the suite stays order-independent.
 */

const ORIGINAL_METRONOME_VERSION = blockConfigVersions.metronome;

afterEach(() => {
  blockConfigVersions.metronome = ORIGINAL_METRONOME_VERSION;
  delete blockMigrators.metronome;
});

describe("synthetic two-version migration", () => {
  it("carries a renamed field's value through the migration into the new field", () => {
    blockConfigVersions.metronome = 2;
    blockMigrators.metronome = {
      // `tempo` was renamed to `bpm` in version 2; the post-migration
      // normalizer only keeps known fields, so the rename must land on `bpm`.
      1: (config: Record<string, unknown>) => ({ bpm: config.tempo }),
    };

    const out = normalizeStoredBlock({
      id: "fixture",
      type: "metronome",
      version: 1,
      config: { tempo: 72 },
    });

    expect(out?.version).toBe(2);
    expect(out?.config).toMatchObject({ bpm: 72 });
  });
});
