"use client";

import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import { featureRegistry } from "@/lib/feature-blocks/registry";
import { FeatureRenderer } from "@/components/feature-blocks/feature-renderer";

type MarketplaceCardProps = {
  block: FeatureBlock;
  added: boolean;
  onAdd: () => void;
  onRemove: () => void;
};

/**
 * One marketplace entry: a live, interactive preview of the real component
 * plus a plus/check button that adds it to (or removes it from) the
 * active workshop page.
 */
export function MarketplaceCard({
  block,
  added,
  onAdd,
  onRemove,
}: MarketplaceCardProps) {
  const def = featureRegistry[block.type as keyof typeof featureRegistry];
  if (!def) return null;

  const Icon = def.icon;

  return (
    <Card className="flex h-full flex-col overflow-hidden" data-testid={`marketplace-card-${block.type}`}>
      <CardContent className="flex h-full flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-foreground">
                {def.label}
              </h3>
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
            className={cn("h-8 w-8 shrink-0", added && "text-success")}
          >
            {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        <div className="min-h-0 flex-1">
          <FeatureRenderer blocks={[block]} />
        </div>
      </CardContent>
    </Card>
  );
}
