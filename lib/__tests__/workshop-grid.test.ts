import { describe, it, expect } from "vitest";
import {
  MAX_GRID_COLUMNS,
  MIN_HEIGHT,
  MAX_HEIGHT,
  ROW_UNIT_PX,
  GAP_PX,
  MD_BREAKPOINT_PX,
  XL_BREAKPOINT_PX,
  blockSize,
  normalizeSize,
  clampSize,
  effectiveSpan,
  sizeFromDelta,
  resizeBlocks,
  reorderBlocks,
  currentGridColumns,
} from "@/lib/workshop-grid";
import type { FeatureBlock } from "@/lib/feature-blocks/types";

function block(id: string, type = "metronome", size?: unknown): FeatureBlock {
  return {
    id,
    type,
    version: 1,
    config: {},
    ...(size !== undefined ? { size: size as never } : {}),
  };
}

describe("workshop-grid constants", () => {
  it("uses a 4-column canonical grid", () => {
    expect(MAX_GRID_COLUMNS).toBe(4);
  });

  it("bounds heights between 1 and 8 rows", () => {
    expect(MIN_HEIGHT).toBe(1);
    expect(MAX_HEIGHT).toBeGreaterThan(MIN_HEIGHT);
    expect(MAX_HEIGHT).toBeLessThanOrEqual(8);
  });

  it("keeps CSS row unit and gap in sync with the component layer", () => {
    expect(ROW_UNIT_PX).toBeGreaterThan(0);
    expect(GAP_PX).toBeGreaterThan(0);
  });
});

describe("currentGridColumns", () => {
  const media = (matches: string[]) => (query: string) => ({
    matches: matches.includes(query),
  });
  const md = `(min-width: ${MD_BREAKPOINT_PX}px)`;
  const xl = `(min-width: ${XL_BREAKPOINT_PX}px)`;

  it("returns 1 column on small screens", () => {
    expect(currentGridColumns(media([]))).toBe(1);
  });

  it("returns 2 columns at the medium breakpoint", () => {
    expect(currentGridColumns(media([md]))).toBe(2);
  });

  it("returns 4 columns at the large breakpoint", () => {
    expect(currentGridColumns(media([md, xl]))).toBe(4);
  });

  it("falls back to 1 column when matchMedia is unavailable", () => {
    const original = window.matchMedia;
    // jsdom does not implement matchMedia.
    (window as { matchMedia?: unknown }).matchMedia = undefined;
    try {
      expect(currentGridColumns()).toBe(1);
    } finally {
      window.matchMedia = original;
    }
  });
});

describe("blockSize", () => {
  it("returns the stored size when present", () => {
    const b = block("a", "metronome", { w: 3, h: 2 });
    expect(blockSize(b)).toEqual({ w: 3, h: 2 });
  });

  it("falls back to the per-type default for known types", () => {
    expect(blockSize(block("a", "metronome")).w).toBeGreaterThan(0);
    expect(blockSize(block("a", "metronome")).h).toBeGreaterThan(0);
    expect(blockSize(block("a", "textBlock")).w).toBe(4);
    expect(blockSize(block("a", "midiConnectionBar")).w).toBe(4);
  });

  it("defaults the ready-made drills tile to full width", () => {
    expect(blockSize(block("a", "drillShortcuts"))).toEqual({ w: 4, h: 1 });
  });

  it("falls back to a sane default for unknown types", () => {
    const size = blockSize(block("a", "mysteryBlock"));
    expect(size.w).toBeGreaterThanOrEqual(1);
    expect(size.w).toBeLessThanOrEqual(MAX_GRID_COLUMNS);
    expect(size.h).toBeGreaterThanOrEqual(MIN_HEIGHT);
    expect(size.h).toBeLessThanOrEqual(MAX_HEIGHT);
  });
});

describe("normalizeSize", () => {
  it("passes through valid sizes", () => {
    expect(normalizeSize({ w: 2, h: 3 })).toEqual({ w: 2, h: 3 });
  });

  it("clamps out-of-range and floors fractional values", () => {
    expect(normalizeSize({ w: 0, h: 99 })).toEqual({ w: 1, h: MAX_HEIGHT });
    expect(normalizeSize({ w: 2.7, h: 1.2 })).toEqual({ w: 2, h: 1 });
  });

  it("returns undefined for non-numeric or missing fields", () => {
    expect(normalizeSize(undefined)).toBeUndefined();
    expect(normalizeSize(null)).toBeUndefined();
    expect(normalizeSize("big")).toBeUndefined();
    expect(normalizeSize({})).toBeUndefined();
    expect(normalizeSize({ w: "2", h: 1 })).toBeUndefined();
    expect(normalizeSize({ w: Number.NaN, h: 1 })).toBeUndefined();
  });
});

describe("clampSize", () => {
  it("clamps into the canonical grid bounds", () => {
    expect(clampSize({ w: 0, h: 0 })).toEqual({ w: 1, h: 1 });
    expect(clampSize({ w: 12, h: 99 })).toEqual({ w: 4, h: MAX_HEIGHT });
  });
});

describe("effectiveSpan", () => {
  it("never exceeds the breakpoint column count", () => {
    expect(effectiveSpan(4, 1)).toBe(1);
    expect(effectiveSpan(3, 2)).toBe(2);
    expect(effectiveSpan(3, 4)).toBe(3);
    expect(effectiveSpan(2, 4)).toBe(2);
  });
});

describe("sizeFromDelta", () => {
  const colWidth = 200;
  const rowHeight = ROW_UNIT_PX + GAP_PX;

  it("grows one column per full column-width of drag", () => {
    const next = sizeFromDelta({ w: 2, h: 1 }, 210, 0, colWidth, rowHeight);
    expect(next.w).toBe(3);
  });

  it("shrinks when dragging inward", () => {
    const next = sizeFromDelta({ w: 3, h: 2 }, -450, 0, colWidth, rowHeight);
    expect(next.w).toBe(1);
  });

  it("keeps the size when the delta is under half a unit", () => {
    const next = sizeFromDelta({ w: 2, h: 1 }, 99, 0, colWidth, rowHeight);
    expect(next).toEqual({ w: 2, h: 1 });
  });

  it("grows rows from vertical delta and clamps at bounds", () => {
    const next = sizeFromDelta({ w: 1, h: 1 }, 0, 10 * rowHeight, colWidth, rowHeight);
    expect(next.h).toBe(MAX_HEIGHT);
    expect(next.w).toBe(1);
  });
});

describe("resizeBlocks", () => {
  it("updates only the target block", () => {
    const blocks = [block("a"), block("b", "textBlock")];
    const next = resizeBlocks(blocks, "a", { w: 4 });
    expect(next[0].size).toEqual({ w: 4, h: 1 });
    expect(next[1].size).toBeUndefined();
  });

  it("merges with the existing size and clamps", () => {
    const blocks = [block("a", "metronome", { w: 2, h: 2 })];
    const next = resizeBlocks(blocks, "a", { h: 50 });
    expect(next[0].size).toEqual({ w: 2, h: MAX_HEIGHT });
  });

  it("returns the same array when the id is missing", () => {
    const blocks = [block("a")];
    expect(resizeBlocks(blocks, "missing", { w: 3 })).toBe(blocks);
  });
});

describe("reorderBlocks", () => {
  const blocks = [block("a"), block("b"), block("c")];

  it("moves the active block to the target index", () => {
    expect(reorderBlocks(blocks, "a", "c").map((b) => b.id)).toEqual(["b", "c", "a"]);
  });

  it("returns the same array for no-op moves", () => {
    expect(reorderBlocks(blocks, "a", "a")).toBe(blocks);
  });

  it("returns the same array for unknown ids", () => {
    expect(reorderBlocks(blocks, "a", "missing")).toBe(blocks);
    expect(reorderBlocks(blocks, "missing", "a")).toBe(blocks);
  });
});
