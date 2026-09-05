"use client";

import type { FeatureBlock } from "@/lib/feature-blocks/types";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import { LibrarySections } from "./library-sections";

type MarketplaceProps = {
  pageBlocks: FeatureBlock[];
  onAddBlock: (type: string) => void;
  onRemoveBlockType: (type: string) => void;
};

/**
 * Marketplace view: the block library in two tiers — interactive components
 * as cards with live previews, sources/transforms as quiet rows. Wrapped in
 * a preview drill runtime (pageId "") so previews are playable without
 * touching practice history.
 */
export function Marketplace({
  pageBlocks,
  onAddBlock,
  onRemoveBlockType,
}: MarketplaceProps) {
  return (
    <DrillRuntimeProvider pageId="">
      <LibrarySections
        pageBlocks={pageBlocks}
        onAddBlock={onAddBlock}
        onRemoveBlockType={onRemoveBlockType}
      />
    </DrillRuntimeProvider>
  );
}
