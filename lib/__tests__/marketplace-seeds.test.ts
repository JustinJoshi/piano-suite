import { describe, it, expect } from "vitest";
import { marketplaceSeeds } from "@/lib/marketplace-seeds";
import { normalizeStoredBlock } from "@/lib/feature-blocks/schemas";

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
});
