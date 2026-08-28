"use client";

import { useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Copy,
  GripVertical,
  MoveDiagonal,
  Settings,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import { getFeatureDefinition } from "@/lib/feature-blocks/registry";
import { FeatureRenderer } from "@/components/feature-blocks/feature-renderer";
import { FieldInput } from "@/components/custom-practice/field-input";
import {
  blockSize,
  clampSize,
  effectiveSpan,
  currentGridColumns,
  sizeFromDelta,
  GAP_PX,
  ROW_UNIT_PX,
  type BlockSize,
} from "@/lib/workshop-grid";

/**
 * Column span classes per canonical width. Responsive prefixes clamp the
 * span to the active template (1 col base, 2 at md, 4 at xl). Literals are
 * required for Tailwind's compiler.
 */
const COL_SPAN_CLASSES: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-1 md:col-span-2 xl:col-span-2",
  3: "col-span-1 md:col-span-2 xl:col-span-3",
  4: "col-span-1 md:col-span-2 xl:col-span-4",
};

type ResizeStart = {
  size: BlockSize;
  x: number;
  y: number;
  colWidthPx: number;
  rowHeightPx: number;
};

type WorkshopTileProps = {
  block: FeatureBlock;
  onResize: (id: string, size: { w?: number; h?: number }) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onConfigChange: (id: string, config: Record<string, unknown>) => void;
};

export function WorkshopTile({
  block,
  onResize,
  onDuplicate,
  onRemove,
  onConfigChange,
}: WorkshopTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const size = clampSize(blockSize(block));
  const [resizing, setResizing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const resizeStartRef = useRef<ResizeStart | null>(null);

  const def = getFeatureDefinition(block.type);

  function onResizePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    const tileEl = e.currentTarget.closest("[data-workshop-tile]");
    if (!(tileEl instanceof HTMLElement)) return;

    const rect = tileEl.getBoundingClientRect();
    const cols = currentGridColumns();
    const span = effectiveSpan(size.w, cols);
    const colWidthPx = (rect.width - (span - 1) * GAP_PX) / span;

    resizeStartRef.current = {
      size,
      x: e.clientX,
      y: e.clientY,
      colWidthPx,
      rowHeightPx: ROW_UNIT_PX + GAP_PX,
    };
    setResizing(true);
    e.preventDefault();
  }

  useEffect(() => {
    if (!resizing) return;

    function onMove(e: PointerEvent) {
      const start = resizeStartRef.current;
      if (!start) return;

      const next = sizeFromDelta(
        start.size,
        e.clientX - start.x,
        e.clientY - start.y,
        start.colWidthPx,
        start.rowHeightPx
      );
      if (next.w !== start.size.w || next.h !== start.size.h) {
        onResize(block.id, next);
      }
    }

    function onUp() {
      resizeStartRef.current = null;
      setResizing(false);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [resizing, block.id, onResize]);

  function updateField(key: string, value: unknown) {
    const config = def
      ? (def.normalizeConfig(block.config) as Record<string, unknown>)
      : block.config;
    onConfigChange(block.id, { ...config, [key]: value });
  }

  return (
    <div
      ref={setNodeRef}
      data-workshop-tile=""
      data-tile-id={block.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        gridRow: `span ${size.h}`,
      }}
      className={cn(
        "group relative z-10",
        COL_SPAN_CLASSES[size.w],
        isDragging && "z-50 opacity-80"
      )}
    >
      <Card className="h-full overflow-hidden">
        <CardContent className="p-4">
          <FeatureRenderer blocks={[block]} />

          {settingsOpen && def ? (
            <div
              data-testid="tile-settings"
              className="mt-4 space-y-4 border-t border-border pt-4"
            >
              {def.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={
                    (block.config as Record<string, unknown>)[field.key]
                  }
                  onChange={(value) => updateField(field.key, value)}
                />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div
        className={cn(
          "absolute right-1 top-1 flex gap-1 transition-opacity",
          "opacity-100 md:opacity-0 md:group-hover:opacity-100",
          (resizing || settingsOpen) && "md:opacity-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          onPointerDown={(e) => {
            e.stopPropagation();
            listeners?.onPointerDown?.(e);
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            listeners?.onKeyDown?.(e);
          }}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <ToolbarButton
          icon={Settings}
          label="Tile settings"
          aria-expanded={settingsOpen}
          className={cn(settingsOpen && "text-primary")}
          onClick={(e) => {
            e.stopPropagation();
            setSettingsOpen((open) => !open);
          }}
        />
        <ToolbarButton
          icon={Copy}
          label="Duplicate"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(block.id);
          }}
        />
        <ToolbarButton
          icon={Trash2}
          label="Remove"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(block.id);
          }}
        />
      </div>

      <button
        type="button"
        data-testid="resize-handle"
        aria-label="Resize tile"
        className={cn(
          "absolute bottom-1 right-1 flex h-6 w-6 cursor-nwse-resize touch-none items-center justify-center rounded-md text-muted-foreground",
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
          resizing && "opacity-100"
        )}
        onPointerDown={onResizePointerDown}
      >
        <MoveDiagonal className="h-4 w-4" />
      </button>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  className,
  "aria-expanded": ariaExpanded,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className?: string;
  "aria-expanded"?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      aria-label={label}
      aria-expanded={ariaExpanded}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
