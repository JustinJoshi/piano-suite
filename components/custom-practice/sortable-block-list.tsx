"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import { SortableBlockItem } from "./sortable-block-item";
import { InsertPlaceholder } from "./insert-placeholder";

type SortableBlockListProps = {
  blocks: FeatureBlock[];
  selectedBlockId: string | null;
  onSelect: (id: string) => void;
  onReorder: (blocks: FeatureBlock[]) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onInsertAtIndex: (index: number) => void;
};

export function SortableBlockList({
  blocks,
  selectedBlockId,
  onSelect,
  onReorder,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  onInsertAtIndex,
}: SortableBlockListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const nextBlocks = [...blocks];
        const [moved] = nextBlocks.splice(oldIndex, 1);
        nextBlocks.splice(newIndex, 0, moved);
        onReorder(nextBlocks);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blocks.map((b) => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          <InsertPlaceholder onClick={() => onInsertAtIndex(0)} />
          {blocks.map((block, index) => (
            <div key={block.id} className="space-y-3">
              <SortableBlockItem
                block={block}
                isSelected={block.id === selectedBlockId}
                canMoveUp={index > 0}
                canMoveDown={index < blocks.length - 1}
                onSelect={() => onSelect(block.id)}
                onMoveUp={() => onMoveUp(block.id)}
                onMoveDown={() => onMoveDown(block.id)}
                onDuplicate={() => onDuplicate(block.id)}
                onRemove={() => onRemove(block.id)}
              />
              <InsertPlaceholder onClick={() => onInsertAtIndex(index + 1)} />
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
