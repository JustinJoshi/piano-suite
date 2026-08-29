"use client";

import { useMemo } from "react";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import { featureRegistry } from "@/lib/feature-blocks/registry";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import { MarketplaceCard } from "./marketplace-card";

type MarketplaceProps = {
  pageBlocks: FeatureBlock[];
  onAddBlock: (type: string) => void;
  onRemoveBlockType: (type: string) => void;
};

/**
 * Marketplace view: every registered component laid out with a live,
 * interactive preview. Wrapped in a preview drill runtime (pageId "") so
 * runtime-driven blocks are playable without touching practice history.
 */
export function Marketplace({
  pageBlocks,
  onAddBlock,
  onRemoveBlockType,
}: MarketplaceProps) {
  const previewBlocks = useMemo(
    () =>
      Object.values(featureRegistry).map((def) => ({
        id: `preview-${def.type}`,
        type: def.type,
        version: 1,
        config: { ...def.defaultConfig },
      })),
    []
  );

  const addedTypes = useMemo(
    () => new Set(pageBlocks.map((b) => b.type)),
    [pageBlocks]
  );

  return (
    <DrillRuntimeProvider pageId="">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {previewBlocks.map((block) => (
          <MarketplaceCard
            key={block.type}
            block={block}
            added={addedTypes.has(block.type)}
            onAdd={() => onAddBlock(block.type)}
            onRemove={() => onRemoveBlockType(block.type)}
          />
        ))}
      </div>
    </DrillRuntimeProvider>
  );
}
