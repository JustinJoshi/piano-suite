import { describe, it, expect } from "vitest";
import { marketplaceSeeds } from "@/lib/marketplace-seeds";
import { normalizeStoredBlock } from "@/lib/feature-blocks/schemas";
import { validateArrangement } from "@/lib/feature-blocks/validate-arrangement";

describe("marketplace seeds", () => {
  it("ships at least five featured pages", () => {
    expect(marketplaceSeeds.length).toBeGreaterThanOrEqual(5);
  });

  it("every seed block is a registered, normalizable block", () => {
    for (const seed of marketplaceSeeds) {
      expect(seed.blocks.length).toBeGreaterThan(0);

      for (const block of seed.blocks) {
        const normalized = normalizeStoredBlock(block);
        expect(normalized).not.toBeNull();
        expect(normalized?.type).toBe(block.type);
      }
    }
  });

  it("has unique seed ids and in-page block ids", () => {
    const ids = marketplaceSeeds.map((seed) => seed.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const seed of marketplaceSeeds) {
      const blockIds = seed.blocks.map((b) => b.id);
      expect(new Set(blockIds).size).toBe(blockIds.length);
    }
  });

  it("carries a first-person author note on every seed", () => {
    for (const seed of marketplaceSeeds) {
      expect(seed.authorNote.length).toBeGreaterThan(20);
      expect(seed.authorNote).toMatch(/\b(I|my)\b/i);
    }
  });

  it("the no-hardware starter seeds an on-screen keyboard", () => {
    const firstChords = marketplaceSeeds.find((s) => s.id === "first-chords");
    expect(firstChords?.blocks.some((b) => b.type === "keyboardDisplay")).toBe(
      true
    );
  });

  it("keeps every seed to one block per type", () => {
    // The local block() helper sets id: type, so two blocks of the same type
    // would collide on the React key and the fork lineage marker.
    for (const seed of marketplaceSeeds) {
      const types = seed.blocks.map((b) => b.type);
      expect(new Set(types).size).toBe(types.length);
    }
  });

  it("includes the three Stage 1 seeds with first-person notes", () => {
    const ids = marketplaceSeeds.map((seed) => seed.id);
    for (const id of ["hanon-cell-lab", "rootless-ii-v-i-slow", "pentatonic-scope"]) {
      expect(ids).toContain(id);
    }
    expect(marketplaceSeeds.length).toBeGreaterThanOrEqual(14);

    for (const id of ["hanon-cell-lab", "rootless-ii-v-i-slow", "pentatonic-scope"]) {
      const seed = marketplaceSeeds.find((s) => s.id === id);
      expect(seed?.authorNote.length).toBeGreaterThan(0);
      expect(seed?.authorNote).toMatch(/\b(I|my)\b/i);
    }
  });

  it("the piece trainer seed assembles the five-block piece workflow and validates", () => {
    const seed = marketplaceSeeds.find((s) => s.id === "piece-trainer");
    expect(seed).toBeDefined();

    // Exactly the plan's five blocks, in the plan's runtime order: source,
    // transport (ramp on), loop transform, falling-note display, keyboard.
    expect(seed!.blocks.map((b) => b.type)).toEqual([
      "pieceLibrary",
      "transport",
      "sectionLoop",
      "noteRoll",
      "keyboardDisplay",
    ]);

    const transport = seed!.blocks.find((b) => b.type === "transport");
    expect(transport?.config).toMatchObject({
      rampEnabled: true,
      rampTargetBpm: 84,
    });

    const sectionLoop = seed!.blocks.find((b) => b.type === "sectionLoop");
    expect(sectionLoop?.config).toMatchObject({
      startBar: 0,
      endBar: 4,
      repeats: 4,
    });

    // The seed is a display-only page (no target block), so the validator
    // carries exactly the single page-level unscored_page guidance issue.
    const result = validateArrangement(seed!.blocks);
    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].issue).toBe("unscored_page");
    }
  });
});
