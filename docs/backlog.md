# Backlog

Running list of outstanding UX/interaction issues that aren't part of a
numbered phase plan (see `docs/audit-2026-09/` for the roadmap). Add an entry
when you notice something broken or janky that isn't worth fixing in the
moment; remove it once it's fixed, with the PR/commit that closed it.

## Open

### Verify the grid drag/resize fix by hand — owner: Justin

**Added:** 2026-09-17. Blocks merging `fix/workshop-grid-drag`.

The fix below is verified *mechanically* only: the sorting strategy is
swapped, the resize gesture is hardened, unit tests, lint, typecheck, build
and `e2e/workshop-grid.spec.ts` + `e2e/a11y.spec.ts` all pass. **Nothing in
that chain proves tiles visually stopped warping** — no automated check in
this repo watches sibling tiles during a drag.

Two things need a human on `/tools/workshop` before this merges:

1. **Drag a tile between others** and confirm siblings stay put instead of
   jumping, overlapping or resizing mid-drag. Use a page with mixed spans —
   a 4-wide `keyboardDisplay` or `noteRoll` next to 2-wide tiles — since
   uniform tiles would have hidden the original bug too.
2. **Judge the new drag preview.** Losing `rectSortingStrategy` also loses
   dnd-kit's "make room" animation: tiles now hold still and a static
   `DragOverlay` placeholder follows the cursor, with the reorder landing on
   drop. That is a deliberate UX change, not a side effect — it needs to
   feel right to you, or the approach needs revisiting.

Remove this entry once checked.

## Closed

### Workshop grid: dragging/resizing a tile visually warps neighboring tiles

**Found:** 2026-09-05. **Closed:** 2026-09-17 on branch
`fix/workshop-grid-drag`, commits `e30b03c` (drag) and `e7f3748` (resize).

Two changes. First, the grid no longer uses dnd-kit's
`rectSortingStrategy`, which assumed uniformly sized items and emitted
preview transforms that didn't match this grid's heterogeneous spans; a
static `DragOverlay` preview now shows the dragged tile while siblings stay
put until the reorder commits. Second, the resize gesture captures the
pointer (so fast drags can't lose it), ends cleanly on `pointercancel`, and
only emits size changes when the size actually changes.

**Decision — `grid-auto-flow: dense` was considered and rejected.** The
original diagnosis suggested dense packing so span changes would backfill
gaps instead of shifting later tiles. It was left out on purpose: this
app's page semantics are order-sensitive. `buildStream`
(`lib/feature-blocks/build-stream.ts`) concatenates source blocks and
applies transforms strictly in page order, and `activeTargetBlock`
(`lib/feature-blocks/target-blocks.ts`) hands the drill runtime to the
*first* target block on the page. Dense packing reorders tiles visually
independent of their DOM order, so the grid would no longer show users how
their page actually composes — and on a page where a lower tile can
silently own the runtime, that lie is not cosmetic. It would also split
visual order from keyboard focus order on the Workshop route, which the
axe serious/critical gate (`e2e/a11y.spec.ts`) scans. Tiles jumping during
a drag was the bug; making a rearranged grid the default state would be a
worse one.
