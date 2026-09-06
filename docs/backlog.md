# Backlog

Running list of outstanding UX/interaction issues that aren't part of a
numbered phase plan (see `docs/audit-2026-09/` for the roadmap and
`docs/phase-9-10-testing-plan.md` for testing-infra work). Add an entry when
you notice something broken or janky that isn't worth fixing in the moment;
remove it once it's fixed, with the PR/commit that closed it.

## Open

### Workshop grid: dragging/resizing a tile visually warps neighboring tiles

**Found:** 2026-09-05, while investigating a missing held-notes readout on
the "First chords" starter page.

Reordering a tile in `components/workshop-grid/workshop-grid.tsx` makes
sibling tiles appear to jump, overlap, or resize mid-drag before settling
into their real position. Root cause, from reading (not yet fixing):

- The grid uses `@dnd-kit/sortable`'s `rectSortingStrategy`
  (`workshop-grid.tsx`) to compute drag-preview transforms. That strategy
  assumes uniformly-sized list items; this grid's tiles have heterogeneous
  spans (1–4 columns, 1–8 rows, see `TYPE_DEFAULT_SIZES` in
  `lib/workshop-grid.ts`), so the preview transform for tiles around the one
  being dragged doesn't match the actual CSS Grid auto-placement geometry.
- The grid doesn't set `grid-auto-flow: dense`, so a span change (drag or
  resize) can shift every later tile in flow order instead of backfilling
  gaps, compounding the appearance that unrelated tiles moved.
- Resizing itself is coarse: `sizeFromDelta` (`lib/workshop-grid.ts`) rounds
  to a whole grid unit per `pointermove`, and the resize pointer handler
  (`workshop-tile.tsx`) doesn't call `setPointerCapture`, so a fast drag can
  lose the pointer mid-resize.

Likely fix direction: either replace `rectSortingStrategy` with a custom
strategy aware of variable spans, or move off dnd-kit's rect-based preview
math entirely for this grid; add `grid-auto-flow: dense`; add
`setPointerCapture` to the resize handler. Not attempted yet — needs its own
investigation/spike before a fix lands.
