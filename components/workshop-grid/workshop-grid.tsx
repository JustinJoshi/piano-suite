"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import { MAX_GRID_COLUMNS, ROW_UNIT_PX, reorderBlocks } from "@/lib/workshop-grid";
import { WorkshopTile } from "./workshop-tile";

type GridCallbacks = {
  onResize: (id: string, size: { w?: number; h?: number }) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onConfigChange: (id: string, config: Record<string, unknown>) => void;
};

type GridBodyProps = GridCallbacks & {
  blocks: FeatureBlock[];
  /** True while a drag is in progress; reveals the grid chrome. */
  gridActive: boolean;
  /** Force the grid guides on (empty workshop shows the canvas). */
  showGuides?: boolean;
};

/**
 * Presentational grid: CSS grid with responsive column templates
 * (1 col → 2 cols at md → 4 cols at xl). Tiles auto-place in block order.
 */
export function GridBody({
  blocks,
  gridActive,
  showGuides = false,
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
      className={cn(
        "relative grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4",
        showChrome && "rounded-xl border border-dashed border-primary/40",
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
              className="rounded-xl border border-dashed border-primary/30 bg-primary/5"
            />
          ))}
        </div>
      ) : null}

      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={rectSortingStrategy}
      >
        {blocks.map((block) => (
          <WorkshopTile
            key={block.id}
            block={block}
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
  onReorder: (blocks: FeatureBlock[]) => void;
};

/**
 * Interactive Workshop grid: drag tiles to reposition (order), resize via
 * the tile corner handle. Grid chrome is visible only while dragging.
 */
export function WorkshopGrid({
  blocks,
  onReorder,
  onResize,
  onDuplicate,
  onRemove,
  onConfigChange,
}: WorkshopGridProps) {
  const [gridActive, setGridActive] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart() {
    setGridActive(true);
  }

  function handleDragEnd(event: DragEndEvent) {
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
      onDragCancel={() => setGridActive(false)}
    >
      <GridBody
        blocks={blocks}
        gridActive={gridActive}
        onResize={onResize}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        onConfigChange={onConfigChange}
      />
    </DndContext>
  );
}
