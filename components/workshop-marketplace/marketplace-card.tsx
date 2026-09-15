"use client";

import { useMemo } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import { featureRegistry } from "@/lib/feature-blocks/registry";
import { getManifest } from "@/lib/feature-blocks/manifest";
import { FeatureRenderer } from "@/components/feature-blocks/feature-renderer";
import { AboutPanel, ExperimentalBadge, requirementLinesFor } from "./about-panel";

type MarketplaceCardProps = {
  block: FeatureBlock;
  added: boolean;
  onAdd: () => void;
  onRemove: () => void;
  pageBlocks: FeatureBlock[];
};

/**
 * One marketplace entry: a live, interactive preview of the real component
 * plus a plus/check button that adds it to (or removes it from) the active
 * workshop page, and an About panel with the manifest's summary,
 * justification, requirements, and status.
 */
export function MarketplaceCard({
  block,
  added,
  onAdd,
  onRemove,
  pageBlocks,
}: MarketplaceCardProps) {
  const requirements = useMemo(
    () => requirementLinesFor(block.type, pageBlocks),
    [block.type, pageBlocks]
  );

  const def = featureRegistry[block.type as keyof typeof featureRegistry];
  if (!def) return null;

  const manifest = getManifest(block.type);
  const Icon = def.icon;

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-raised",
        added && "border-success/40"
      )}
      data-testid={`marketplace-card-${block.type}`}
    >
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/20">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate font-heading text-sm font-semibold text-foreground">
                  {def.label}
                </h3>
                {manifest?.status === "experimental" && <ExperimentalBadge />}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {def.description}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant={added ? "secondary" : "outline"}
            size="icon"
            aria-pressed={added}
            aria-label={added ? `${def.label} added` : `Add ${def.label}`}
            onClick={added ? onRemove : onAdd}
            className={cn(
              "h-8 w-8 shrink-0 rounded-full",
              added && "border-success/40 bg-success/10 text-success"
            )}
          >
            {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        <div
          className="min-h-0 flex-1 rounded-xl border border-border/70 bg-background/40 p-3"
          data-testid={`marketplace-preview-${block.type}`}
        >
          <FeatureRenderer blocks={[block]} />
        </div>

        {manifest && (
          <AboutPanel
            type={manifest.type}
            label={manifest.label}
            summary={manifest.summary}
            justification={manifest.justification}
            requirements={requirements}
            experimental={manifest.status === "experimental"}
          />
        )}
      </CardContent>
    </Card>
  );
}
