"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getFeatureDefinition } from "@/lib/feature-blocks/registry";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import type { WiringIssue } from "@/lib/feature-blocks/manifest-types";
import { MAX_GRID_COLUMNS, ROW_UNIT_PX, reorderBlocks } from "@/lib/workshop-grid";
import { WorkshopTile } from "./workshop-tile";

/**
 * dnd-kit's rect-based strategies translate every preview from the dragged
 * item's rectangle, which only works when all items share one size. Workshop
 * tiles span 1-4 columns and 1-8 rows, so neighbours would warp mid-drag.
 * No transform means no warp; the DragOverlay carries the visual instead.
 */
export const noTransformStrategy: SortingStrategy = () => null;

/**
 * Static drag preview: icon + label only. It must not mount the block's
 * feature component — a second live mount of a `maxPerPage: 1` block
 * (transport, midiConnectionBar) would double-run it for every drag.
 */
export function DragOverlayPlaceholder({ block }: { block: FeatureBlock }) {
  const def = getFeatureDefinition(block.type);
  if (!def) return null;
  const Icon = def.icon;
  return (
    <Card
      data-testid="drag-overlay-placeholder"
      aria-hidden
      className="border-primary/60 shadow-raised"
    >
      <CardContent className="flex items-center gap-2 p-4 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">{def.label}</span>
      </CardContent>
    </Card>
  );
}

type GridCallbacks = {
  onResize: (id: string, size: { w?: number; h?: number }) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onConfigChange: (id: string, config: Record<string, unknown>) => void;
};

type GridBodyProps = GridCallbacks & {
  blocks: FeatureBlock[];
  /** Wiring issues per block id, keyed once so props stay flat. */
  issuesByBlockId?: Map<string, WiringIssue[]>;
  /** True while a drag is in progress; reveals the grid chrome. */
  gridActive: boolean;
  /** Force the grid guides on (empty workshop shows the canvas). */
  showGuides?: boolean;
  /** Stretch the grid over the remaining page height. */
  fill?: boolean;
};

/**
 * Presentational grid: CSS grid with responsive column templates
 * (1 col → 2 cols at md → 4 cols at xl). Tiles auto-place in block order.
 */
export function GridBody({
  blocks,
  issuesByBlockId,
  gridActive,
  showGuides = false,
  fill = false,
  onResize,
  onDuplicate,
  onRemove,
  onConfigChange,
}: GridBodyProps) {
  const showChrome = gridActive || showGuides;
  return (
    <div
      data-testid="workshop-grid"
      data-grid-active={gridActive ? "true" : undefined}
      data-grid-empty={blocks.length === 0 ? "true" : undefined}
      data-grid-full={fill ? "true" : undefined}
      className={cn(
        "relative grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
        fill && "flex-1",
        showChrome && "rounded-2xl border border-dashed border-primary/40 bg-primary/[0.03]",
        blocks.length === 0 && "min-h-[24rem] content-start"
      )}
      style={{ gridAutoRows: `minmax(${ROW_UNIT_PX}px, auto)` }}
    >
      {showChrome ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 grid auto-rows-fr grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          {Array.from({ length: MAX_GRID_COLUMNS }, (_, i) => (
            <div
              key={i}
              data-testid="grid-guide"
              className="staff-lines rounded-2xl border border-dashed border-primary/25 bg-primary/5"
            />
          ))}
        </div>
      ) : null}

      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={noTransformStrategy}
      >
        {blocks.map((block) => (
          <WorkshopTile
            key={block.id}
            block={block}
            issues={issuesByBlockId?.get(block.id)}
            onResize={onResize}
            onDuplicate={onDuplicate}
            onRemove={onRemove}
            onConfigChange={onConfigChange}
          />
        ))}
      </SortableContext>
    </div>
  );
}

type WorkshopGridProps = GridCallbacks & {
  blocks: FeatureBlock[];
  /** Wiring issues per block id, keyed once so props stay flat. */
  issuesByBlockId?: Map<string, WiringIssue[]>;
  onReorder: (blocks: FeatureBlock[]) => void;
  /** Force the grid guides on (empty workshop shows the canvas). */
  showGuides?: boolean;
  /** Stretch the grid over the remaining page height. */
  fill?: boolean;
};

/**
 * Interactive Workshop grid: drag tiles to reposition (order), resize via
 * the tile corner handle. Grid chrome is visible only while dragging.
 */
export function WorkshopGrid({
  blocks,
  issuesByBlockId,
  onReorder,
  onResize,
  onDuplicate,
  onRemove,
  onConfigChange,
  showGuides,
  fill,
}: WorkshopGridProps) {
  const [gridActive, setGridActive] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const activeBlock =
    blocks.find((b) => b.id === activeBlockId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveBlockId(String(event.active.id));
    setGridActive(true);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveBlockId(null);
    setGridActive(false);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(reorderBlocks(blocks, String(active.id), String(over.id)));
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveBlockId(null);
        setGridActive(false);
      }}
    >
      <GridBody
        blocks={blocks}
        issuesByBlockId={issuesByBlockId}
        gridActive={gridActive}
        showGuides={showGuides}
        fill={fill}
        onResize={onResize}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        onConfigChange={onConfigChange}
      />
      <DragOverlay aria-hidden>
        {activeBlock
          ? <DragOverlayPlaceholder block={activeBlock} />
          : null}
      </DragOverlay>
    </DndContext>
  );
}
