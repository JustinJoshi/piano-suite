"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PracticePage, FeatureBlock } from "@/lib/feature-blocks/types";
import { getFeatureDefinition } from "@/lib/feature-blocks/registry";
import { FeaturePalette } from "@/components/custom-practice/feature-palette";
import { FeatureSettingsPanel } from "@/components/custom-practice/feature-settings-panel";
import { SortableBlockList } from "@/components/custom-practice/sortable-block-list";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import {
  getPracticePage,
  setPracticePage,
  subscribePracticePage,
  getServerPracticePage,
  generateId,
} from "@/lib/custom-practice-storage";

export function PracticePageEditor() {
  const page = useSyncExternalStore(
    subscribePracticePage,
    getPracticePage,
    getServerPracticePage
  );

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  const selectedBlock = useMemo(
    () => page.blocks.find((b) => b.id === selectedBlockId) ?? null,
    [page.blocks, selectedBlockId]
  );

  function updatePage(updater: (prev: PracticePage) => PracticePage) {
    setPracticePage(updater(page));
  }

  function openPalette(atIndex?: number) {
    setInsertIndex(atIndex ?? null);
    setShowPalette(true);
  }

  function closePalette() {
    setInsertIndex(null);
    setShowPalette(false);
  }

  function addBlock(type: string) {
    const def = getFeatureDefinition(type);
    if (!def) return;

    const newBlock: FeatureBlock = {
      id: generateId(),
      type,
      version: 1,
      config: { ...def.defaultConfig },
    };

    const targetIndex = insertIndex ?? page.blocks.length;

    updatePage((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks.slice(0, targetIndex),
        newBlock,
        ...prev.blocks.slice(targetIndex),
      ],
    }));
    setSelectedBlockId(newBlock.id);
    closePalette();
  }

  function updateBlockConfig(id: string, config: Record<string, unknown>) {
    updatePage((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) =>
        b.id === id ? { ...b, config } : b
      ),
    }));
  }

  function removeBlock(id: string) {
    updatePage((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  }

  function duplicateBlock(id: string) {
    const block = page.blocks.find((b) => b.id === id);
    if (!block) return;

    const index = page.blocks.indexOf(block);
    const newBlock: FeatureBlock = {
      ...block,
      id: generateId(),
      config: { ...block.config },
    };

    updatePage((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks.slice(0, index + 1),
        newBlock,
        ...prev.blocks.slice(index + 1),
      ],
    }));
    setSelectedBlockId(newBlock.id);
  }

  function moveBlock(id: string, direction: "up" | "down") {
    const index = page.blocks.findIndex((b) => b.id === id);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === page.blocks.length - 1) return;

    const nextIndex = direction === "up" ? index - 1 : index + 1;
    const nextBlocks = [...page.blocks];
    [nextBlocks[index], nextBlocks[nextIndex]] = [
      nextBlocks[nextIndex],
      nextBlocks[index],
    ];

    updatePage((prev) => ({ ...prev, blocks: nextBlocks }));
  }

  function handleReorder(blocks: FeatureBlock[]) {
    updatePage((prev) => ({ ...prev, blocks }));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (showPalette) return;
      if (event.key !== "/") return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        const tagName = target.tagName.toLowerCase();
        const isEditable =
          tagName === "input" ||
          tagName === "textarea" ||
          target.isContentEditable;

        if (isEditable) return;
      }

      event.preventDefault();
      openPalette();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPalette]);

  return (
    <DrillRuntimeProvider>
      <div className="mx-auto grid max-w-3xl gap-6 lg:max-w-5xl lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <input
            type="text"
            value={page.title}
            onChange={(e) =>
              updatePage((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full bg-transparent text-2xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Untitled practice page"
          />

          {page.blocks.length === 0 ? (
            <div
              className={cn(
                "rounded-xl border border-dashed border-border bg-card p-10 text-center"
              )}
            >
              <p className="mb-4 text-muted-foreground">
                This page is empty. Add your first feature to start practicing.
              </p>
              <Button onClick={() => openPalette()}>
                <Plus className="mr-2 h-4 w-4" />
                Add feature
              </Button>
            </div>
          ) : (
            <SortableBlockList
              blocks={page.blocks}
              selectedBlockId={selectedBlockId}
              onSelect={setSelectedBlockId}
              onReorder={handleReorder}
              onMoveUp={(id) => moveBlock(id, "up")}
              onMoveDown={(id) => moveBlock(id, "down")}
              onDuplicate={duplicateBlock}
              onRemove={removeBlock}
              onInsertAtIndex={openPalette}
            />
          )}

          {showPalette ? (
            <FeaturePalette
              onSelect={addBlock}
              onCancel={closePalette}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          {selectedBlock ? (
            <FeatureSettingsPanel
              block={selectedBlock}
              onChange={(config) => updateBlockConfig(selectedBlock.id, config)}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Select a feature to edit its settings.
            </div>
          )}
        </div>
      </div>
    </DrillRuntimeProvider>
  );
}
