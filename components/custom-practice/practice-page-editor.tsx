"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Plus, Trash2, Copy, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PracticePage, FeatureBlock } from "@/lib/feature-blocks/types";
import { getFeatureDefinition } from "@/lib/feature-blocks/registry";
import { FeatureRenderer } from "@/components/feature-blocks/feature-renderer";
import { FeaturePalette } from "@/components/custom-practice/feature-palette";
import { FeatureSettingsPanel } from "@/components/custom-practice/feature-settings-panel";
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

  const selectedBlock = useMemo(
    () => page.blocks.find((b) => b.id === selectedBlockId) ?? null,
    [page.blocks, selectedBlockId]
  );

  function updatePage(updater: (prev: PracticePage) => PracticePage) {
    setPracticePage(updater(page));
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

    updatePage((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
    setSelectedBlockId(newBlock.id);
    setShowPalette(false);
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

    const def = getFeatureDefinition(block.type);
    if (!def) return;

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

  return (
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
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <p className="mb-4 text-muted-foreground">
              This page is empty. Add your first feature to start practicing.
            </p>
            <Button onClick={() => setShowPalette(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add feature
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {page.blocks.map((block) => {
              const isSelected = block.id === selectedBlockId;
              return (
                <Card
                  key={block.id}
                  onClick={() => setSelectedBlockId(block.id)}
                  className={cn(
                    "cursor-pointer transition-shadow",
                    isSelected && "ring-2 ring-primary"
                  )}
                >
                  <CardContent className="p-4">
                    <FeatureRenderer blocks={[block]} />
                  </CardContent>
                </Card>
              );
            })}

            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={() => setShowPalette(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add feature
            </Button>
          </div>
        )}

        {showPalette ? (
          <FeaturePalette
            onSelect={addBlock}
            onCancel={() => setShowPalette(false)}
          />
        ) : null}
      </div>

      <div className="space-y-4">
        {selectedBlock ? (
          <>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => moveBlock(selectedBlock.id, "up")}
                disabled={page.blocks[0]?.id === selectedBlock.id}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => moveBlock(selectedBlock.id, "down")}
                disabled={
                  page.blocks[page.blocks.length - 1]?.id === selectedBlock.id
                }
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => duplicateBlock(selectedBlock.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => removeBlock(selectedBlock.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <FeatureSettingsPanel
              block={selectedBlock}
              onChange={(config) => updateBlockConfig(selectedBlock.id, config)}
              onRemove={() => removeBlock(selectedBlock.id)}
            />
          </>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
            Select a feature to edit its settings.
          </div>
        )}
      </div>
    </div>
  );
}
