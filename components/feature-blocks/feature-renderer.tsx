"use client";

import type { FeatureBlock } from "@/lib/feature-blocks/types";
import { getFeatureDefinition } from "@/lib/feature-blocks/registry";

export function FeatureRenderer({ blocks }: { blocks: FeatureBlock[] }) {
  return (
    <>
      {blocks.map((block) => {
        const def = getFeatureDefinition(block.type);
        if (!def) {
          console.warn(`Unknown feature type: ${block.type}`);
          return null;
        }

        const config = def.normalizeConfig(block.config);
        const Component = def.component;

        return (
          <Component
            key={block.id}
            {...config}
            // blockId is passed outside the spread config: runtime source
            // blocks need their position in the page, not a settings field.
            // The key/ref/children rule guards config fields only — this is a
            // render prop, so React does not swallow it (and config is
            // validated against schemas that cannot contain `blockId`).
            blockId={block.id}
          />
        );
      })}
    </>
  );
}
