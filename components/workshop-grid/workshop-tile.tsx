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
import type { FieldDescriptor } from "@/lib/feature-blocks/types";
import type { WiringIssue } from "@/lib/feature-blocks/manifest-types";
import { getFeatureDefinition } from "@/lib/feature-blocks/registry";
import { FeatureRenderer } from "@/components/feature-blocks/feature-renderer";
import { FieldInput } from "@/components/custom-practice/field-input";
import { OPEN_TILE_SETTINGS_EVENT } from "@/lib/keyboard";
import {
  blockSize,
  clampSize,
  effectiveSpan,
  currentGridColumns,
  sizeFromDelta,
  MAX_GRID_COLUMNS,
  MIN_HEIGHT,
  MAX_HEIGHT,
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
  last: BlockSize;
  x: number;
  y: number;
  colWidthPx: number;
  rowHeightPx: number;
};

type WorkshopTileProps = {
  block: FeatureBlock;
  /** Wiring issues for this block, when the page arrangement has any. */
  issues?: WiringIssue[];
  onResize: (id: string, size: { w?: number; h?: number }) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onConfigChange: (id: string, config: Record<string, unknown>) => void;
};

export function WorkshopTile({
  block,
  issues,
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

  // The command palette targets tiles by id through pub/sub — the panel
  // state is tile-internal, same pattern as the starter picker.
  useEffect(() => {
    function requestSettings(event: Event) {
      const detail = (event as CustomEvent<{ tileId: string }>).detail;
      if (detail?.tileId === block.id) {
        setSettingsOpen(true);
      }
    }

    window.addEventListener(OPEN_TILE_SETTINGS_EVENT, requestSettings);
    return () =>
      window.removeEventListener(OPEN_TILE_SETTINGS_EVENT, requestSettings);
  }, [block.id]);

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
      last: size,
      x: e.clientX,
      y: e.clientY,
      colWidthPx,
      rowHeightPx: ROW_UNIT_PX + GAP_PX,
    };
    // Capture the pointer so pointermove keeps delivering even when a fast
    // drag leaves the window; jsdom and older browsers may lack the API.
    if (typeof e.currentTarget.setPointerCapture === "function") {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
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
      if (next.w !== start.last.w || next.h !== start.last.h) {
        start.last = next;
        onResize(block.id, next);
      }
    }

    function onUp() {
      resizeStartRef.current = null;
      setResizing(false);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [resizing, block.id, onResize]);

  function updateField(key: string, value: unknown) {
    const config = def
      ? (def.normalizeConfig(block.config) as Record<string, unknown>)
      : block.config;
    onConfigChange(block.id, { ...config, [key]: value });
  }

  // Keyboard resize: the drag handle is pointer-only, so the gear panel
  // exposes the same operation as plain range fields. onResize flows to
  // the editor, which already normalizes/clamps — no size math here.
  const sizeFields: FieldDescriptor[] = [
    {
      kind: "range",
      key: "width",
      label: "Width",
      min: 1,
      max: MAX_GRID_COLUMNS,
      step: 1,
    },
    {
      kind: "range",
      key: "height",
      label: "Height",
      min: MIN_HEIGHT,
      max: MAX_HEIGHT,
      step: 1,
    },
  ];

  return (
    <div
      ref={setNodeRef}
      data-workshop-tile=""
      data-tile-id={block.id}
      tabIndex={0}
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
      <Card
        className={cn(
          "h-full overflow-hidden transition-shadow",
          (settingsOpen || resizing) && "border-primary/40 shadow-raised",
          isDragging && "border-primary/60 shadow-raised"
        )}
      >
        <CardContent className="p-4">
          <FeatureRenderer blocks={[block]} />

          {settingsOpen && def ? (
            <div
              data-testid="tile-settings"
              className="mt-4 space-y-4 border-t border-border pt-4"
            >
              {sizeFields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  idPrefix={block.id}
                  value={field.key === "width" ? size.w : size.h}
                  onChange={(value) =>
                    onResize(
                      block.id,
                      field.key === "width"
                        ? { w: Number(value) }
                        : { h: Number(value) }
                    )
                  }
                />
              ))}
              {def.fields.map((field) => (
                <FieldInput
                  key={field.key}
                  field={field}
                  idPrefix={block.id}
                  value={
                    (block.config as Record<string, unknown>)[field.key]
                  }
                  onChange={(value) => updateField(field.key, value)}
                />
              ))}
            </div>
          ) : null}

          {issues && issues.length > 0 ? (
            <div
              data-testid="tile-wiring-notice"
              className="mt-4 space-y-1 rounded-lg border border-dashed border-border bg-muted/30 p-2.5"
            >
              {issues.map((wiring) => (
                <p
                  key={`${wiring.issue}-${wiring.detail}`}
                  className="text-xs text-muted-foreground"
                >
                  {wiringNotice(wiring)}
                </p>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div
        className={cn(
          "glass absolute right-2 top-2 flex gap-0.5 rounded-lg border border-border p-0.5 shadow-surface transition-opacity",
          "opacity-100 md:opacity-0 md:group-hover:opacity-100",
          "focus-within:md:opacity-100",
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

/**
 * Plain-language guidance per wiring issue, per the Step-3 mapping. The
 * validator's enum never reaches the user; for an unmet requirement the
 * structured `requirement` field names what to add. Guidance, not
 * enforcement — the block still renders.
 */
export function wiringNotice(issue: WiringIssue): string {
  if (issue.issue === "orphan_transform") {
    return "This transform has nothing to transform. Add a source above it.";
  }
  switch (issue.requirement) {
    case "transport":
      return "Add a transport block to set the tempo for this page.";
    case "practiceNotes":
      return "Add a source block (like the chord library) so there is something to show here.";
    case "midiInput":
      return "Connect a MIDI keyboard, or add the on-screen keyboard, so this block can hear notes.";
    default:
      return "This block is missing something it needs to run. Check its settings.";
  }
}
