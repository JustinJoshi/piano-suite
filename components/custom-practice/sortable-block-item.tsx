"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import { FeatureRenderer } from "@/components/feature-blocks/feature-renderer";

type SortableBlockItemProps = {
  block: FeatureBlock;
  isSelected: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
};

export function SortableBlockItem({
  block,
  isSelected,
  canMoveUp,
  canMoveDown,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: SortableBlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group", isDragging && "z-50 opacity-80")}
    >
      <Card
        onClick={onSelect}
        className={cn(
          "cursor-pointer transition-shadow",
          isSelected && "ring-2 ring-primary"
        )}
      >
        <CardContent className="flex items-start gap-3 p-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
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
            <GripVertical className="h-5 w-5" />
          </Button>

          <div className="min-w-0 flex-1">
            <FeatureRenderer blocks={[block]} />
          </div>

          <div
            className={cn(
              "flex shrink-0 flex-col gap-1 transition-opacity",
              "opacity-100 md:opacity-0 md:group-hover:opacity-100",
              isSelected && "md:opacity-100"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <ToolbarButton
              icon={ArrowUp}
              label="Move up"
              disabled={!canMoveUp}
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
            />
            <ToolbarButton
              icon={ArrowDown}
              label="Move down"
              disabled={!canMoveDown}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
            />
            <ToolbarButton
              icon={Copy}
              label="Duplicate"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            />
            <ToolbarButton
              icon={Trash2}
              label="Remove"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  disabled,
  className,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  disabled?: boolean;
  className?: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled}
      className={cn("h-7 w-7", className)}
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
