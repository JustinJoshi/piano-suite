import { describe, it, expect } from "vitest";
import {
  normalizeStoredBlock,
  normalizeStoredPage,
} from "@/lib/feature-blocks/schemas";
import type { ValidatedBlock } from "@/lib/feature-blocks/schemas";
import { MAX_GRID_COLUMNS, MAX_HEIGHT, type BlockSize } from "@/lib/workshop-grid";

/**
 * `normalizeStoredBlock` attaches `size` at runtime (see schemas.ts) but the
 * declared `ValidatedBlock` return type doesn't list it yet, so tests read it
 * through this narrow cast rather than widening the production type.
 */
function sizeOf(block: ValidatedBlock | null): BlockSize | undefined {
  return (block as (ValidatedBlock & { size?: BlockSize }) | null)?.size;
}

describe("normalizeStoredBlock size handling", () => {
  it("keeps a valid size on the block", () => {
    const block = normalizeStoredBlock({
      id: "b1",
      type: "metronome",
      version: 1,
      config: { bpm: 120 },
      size: { w: 3, h: 2 },
    });

    expect(block).not.toBeNull();
    expect(sizeOf(block)).toEqual({ w: 3, h: 2 });
  });

  it("accepts a drillShortcuts block so the tile persists", () => {
    const block = normalizeStoredBlock({
      id: "b1",
      type: "drillShortcuts",
      version: 1,
      config: {},
      size: { w: 4, h: 1 },
    });

    expect(block).not.toBeNull();
    expect(block?.type).toBe("drillShortcuts");
    expect(sizeOf(block)).toEqual({ w: 4, h: 1 });
  });

  it("clamps out-of-range sizes instead of dropping the block", () => {
    const block = normalizeStoredBlock({
      id: "b1",
      type: "metronome",
      version: 1,
      config: {},
      size: { w: 999, h: 0 },
    });

    expect(sizeOf(block)).toEqual({ w: MAX_GRID_COLUMNS, h: 1 });
    expect(MAX_HEIGHT).toBeGreaterThan(1);
  });

  it("omits size when absent (legacy blocks stay unchanged)", () => {
    const block = normalizeStoredBlock({
      id: "b1",
      type: "metronome",
      version: 1,
      config: {},
    });

    expect(block).not.toBeNull();
    expect("size" in (block as object)).toBe(false);
  });

  it("omits a malformed size", () => {
    const block = normalizeStoredBlock({
      id: "b1",
      type: "metronome",
      version: 1,
      config: {},
      size: "wide",
    });

    expect(block).not.toBeNull();
    expect("size" in (block as object)).toBe(false);
  });
});

describe("normalizeStoredPage size round-trip", () => {
  it("preserves block sizes through a full page validation", () => {
    const page = normalizeStoredPage({
      clientPageId: "page-1",
      title: "Warmup",
      blocks: [
        { id: "b1", type: "metronome", version: 1, config: {}, size: { w: 2, h: 1 } },
        { id: "b2", type: "textBlock", version: 1, config: { text: "hi" }, size: { w: 4, h: 2 } },
      ],
      updatedAt: 1000,
    });

    expect(page).not.toBeNull();
    expect(sizeOf(page?.blocks[0] ?? null)).toEqual({ w: 2, h: 1 });
    expect(sizeOf(page?.blocks[1] ?? null)).toEqual({ w: 4, h: 2 });
  });

  it("still validates pages without sizes", () => {
    const page = normalizeStoredPage({
      clientPageId: "page-1",
      title: "Warmup",
      blocks: [{ id: "b1", type: "metronome", version: 1, config: {} }],
      updatedAt: 1000,
    });

    expect(page).not.toBeNull();
    expect(page?.blocks).toHaveLength(1);
  });
});
