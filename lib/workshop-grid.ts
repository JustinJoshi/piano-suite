import type { FeatureBlock } from "./feature-blocks/types";

/**
 * Pure layout math for the Workshop grid.
 *
 * The grid is a CSS grid with a canonical 4-column layout on desktop that
 * scales down (2 columns at md, 1 column at base). Block sizes are stored in
 * canonical column units; `effectiveSpan` clamps them per breakpoint.
 *
 * This module must stay free of React / DOM imports: it is bundled by Convex
 * (via `lib/feature-blocks/schemas.ts`) and unit-tested in isolation.
 */

export const MAX_GRID_COLUMNS = 4;
export const MIN_HEIGHT = 1;
export const MAX_HEIGHT = 8;

/**
 * Visual row unit in px. The grid component must keep its CSS
 * (`grid-auto-rows`) in sync with this constant.
 */
export const ROW_UNIT_PX = 160;

/** Grid gap in px (Tailwind gap-4). Kept in sync with the grid component. */
export const GAP_PX = 16;

/** Breakpoints (Tailwind defaults) mirrored for resize math. */
export const MD_BREAKPOINT_PX = 768;
export const XL_BREAKPOINT_PX = 1280;

export type MediaQueryFn = (query: string) => { matches: boolean };

/**
 * Active grid column count for the current viewport. `match` is injectable
 * so tests can stub `window.matchMedia`. Environments without matchMedia
 * (jsdom, old browsers) fall back to the smallest grid.
 */
export function currentGridColumns(
  match: MediaQueryFn = (query) => ({
    matches:
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(query).matches,
  })
): number {
  if (match(`(min-width: ${XL_BREAKPOINT_PX}px)`).matches) return MAX_GRID_COLUMNS;
  if (match(`(min-width: ${MD_BREAKPOINT_PX}px)`).matches) return 2;
  return 1;
}

export type BlockSize = { w: number; h: number };

const DEFAULT_SIZE: BlockSize = { w: 2, h: 1 };

const TYPE_DEFAULT_SIZES: Record<string, BlockSize> = {
  metronome: { w: 2, h: 1 },
  drillTimer: { w: 2, h: 1 },
  chordSet: { w: 2, h: 2 },
  textBlock: { w: 4, h: 1 },
  midiConnectionBar: { w: 4, h: 1 },
  drillShortcuts: { w: 4, h: 1 },
  keyboardDisplay: { w: 4, h: 1 },
  scaleRunner: { w: 2, h: 2 },
  rootCycle: { w: 2, h: 2 },
  progression: { w: 2, h: 2 },
  sessionStats: { w: 2, h: 1 },
  restTimer: { w: 2, h: 1 },
  transport: { w: 4, h: 2 },
  rhythmPattern: { w: 2, h: 2 },
  targetDisplay: { w: 2, h: 2 },
  chordLibrary: { w: 2, h: 2 },
  scaleLibrary: { w: 2, h: 2 },
  noteRoll: { w: 4, h: 3 },
  pieceLibrary: { w: 2, h: 2 },
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function toInt(n: unknown): number | undefined {
  const parsed = typeof n === "number" ? Math.floor(n) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Resolved size for a block: stored size, else the per-type default. */
export function blockSize(block: {
  type: string;
  size?: BlockSize;
}): BlockSize {
  if (block.size) return block.size;
  return TYPE_DEFAULT_SIZES[block.type] ?? DEFAULT_SIZE;
}

/** Validates and clamps an unknown value into a `BlockSize`. */
export function normalizeSize(raw: unknown): BlockSize | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const w = toInt(r.w);
  const h = toInt(r.h);
  if (w === undefined || h === undefined) return undefined;
  return clampSize({ w, h });
}

export function clampSize(size: BlockSize): BlockSize {
  return {
    w: clamp(size.w, 1, MAX_GRID_COLUMNS),
    h: clamp(size.h, MIN_HEIGHT, MAX_HEIGHT),
  };
}

/** Column span for a stored width at a breakpoint with `cols` columns. */
export function effectiveSpan(w: number, cols: number): number {
  return Math.min(w, cols);
}

/**
 * New size for a resize drag: start size plus pixel deltas converted to
 * grid units. Deltas under half a unit keep the current size.
 */
export function sizeFromDelta(
  start: BlockSize,
  dx: number,
  dy: number,
  colWidthPx: number,
  rowHeightPx: number
): BlockSize {
  const w = start.w + Math.round(dx / colWidthPx);
  const h = start.h + Math.round(dy / rowHeightPx);
  return clampSize({ w, h });
}

/** Pure update: resize one block, clamping into grid bounds. */
export function resizeBlocks(
  blocks: FeatureBlock[],
  id: string,
  size: Partial<BlockSize>
): FeatureBlock[] {
  const target = blocks.find((b) => b.id === id);
  if (!target) return blocks;

  const current = blockSize(target);
  const next = clampSize({
    w: size.w ?? current.w,
    h: size.h ?? current.h,
  });

  return blocks.map((b) => (b.id === id ? { ...b, size: next } : b));
}

/** Pure update: move `activeId` to the index of `overId` (dnd-kit reorder). */
export function reorderBlocks<T extends { id: string }>(
  items: T[],
  activeId: string,
  overId: string
): T[] {
  if (activeId === overId) return items;

  const oldIndex = items.findIndex((i) => i.id === activeId);
  const newIndex = items.findIndex((i) => i.id === overId);
  if (oldIndex === -1 || newIndex === -1) return items;

  const next = [...items];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  return next;
}
