import { describe, it, expect } from "vitest";
import {
  normalizeStoredBlock,
  normalizeStoredPage,
} from "@/lib/feature-blocks/schemas";
import { MAX_GRID_COLUMNS, MAX_HEIGHT } from "@/lib/workshop-grid";

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
    expect(block?.size).toEqual({ w: 3, h: 2 });
  });

  it("clamps out-of-range sizes instead of dropping the block", () => {
    const block = normalizeStoredBlock({
      id: "b1",
      type: "metronome",
      version: 1,
      config: {},
      size: { w: 999, h: 0 },
    });

    expect(block?.size).toEqual({ w: MAX_GRID_COLUMNS, h: 1 });
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
    expect(page?.blocks[0].size).toEqual({ w: 2, h: 1 });
    expect(page?.blocks[1].size).toEqual({ w: 4, h: 2 });
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
