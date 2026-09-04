"use client";

import { useMemo } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import { featureRegistry } from "@/lib/feature-blocks/registry";
import type { ComponentManifest } from "@/lib/feature-blocks/manifest-types";
import { FeatureRenderer } from "@/components/feature-blocks/feature-renderer";
import { AboutPanel, ExperimentalBadge, requirementLinesFor } from "./about-panel";
import { chordLibraryDefaultConfig } from "@/lib/feature-blocks/chord-library/config";
import { generateChords } from "@/lib/feature-blocks/chord-library/generate";
import { scaleLibraryDefaultConfig } from "@/lib/feature-blocks/scale-library/config";
import { generateScale } from "@/lib/feature-blocks/scale-library/generate";
import type { PracticeNote } from "@/lib/practice-note";

const SAMPLE_SYMBOL_LIMIT = 5;

function sampleSymbols(notes: PracticeNote[]): string | null {
  if (notes.length === 0) return null;
  const head = notes
    .slice(0, SAMPLE_SYMBOL_LIMIT)
    .map((note) => note.symbol)
    .join(" · ");
  return notes.length > SAMPLE_SYMBOL_LIMIT
    ? `${head} · +${notes.length - SAMPLE_SYMBOL_LIMIT} more`
    : head;
}

/**
 * One-line output sample for the row (the confirmed open decision): run the
 * block's own generator on its default config. Piece library needs
 * uploaded-MIDI state and rhythm pattern needs an upstream input, so both
 * show their summary only — an honest empty state beats a fake sample.
 */
function outputSample(type: string): string | null {
  if (type === "chordLibrary") {
    return sampleSymbols(generateChords(chordLibraryDefaultConfig));
  }
  if (type === "scaleLibrary") {
    return sampleSymbols(generateScale(scaleLibraryDefaultConfig));
  }
  return null;
}

type SupplementaryRowProps = {
  manifest: ComponentManifest;
  added: boolean;
  onAdd: () => void;
  onRemove: () => void;
  pageBlocks: FeatureBlock[];
};

/**
 * Quiet single-line row for a source or transform: icon, label, one-line
 * summary, an optional output sample, the add button, and the About panel
 * (which carries the live preview). No Card, no preview surface in the row.
 */
export function SupplementaryRow({
  manifest,
  added,
  onAdd,
  onRemove,
  pageBlocks,
}: SupplementaryRowProps) {
  const requirements = useMemo(
    () => requirementLinesFor(manifest.type, pageBlocks),
    [manifest.type, pageBlocks]
  );
  const previewBlock = useMemo<FeatureBlock>(
    () => ({
      id: `preview-${manifest.type}`,
      type: manifest.type,
      version: 1,
      config: {},
    }),
    [manifest.type]
  );
  const sample = useMemo(() => outputSample(manifest.type), [manifest.type]);

  const def = featureRegistry[manifest.type as keyof typeof featureRegistry];
  if (!def) return null;

  const Icon = def.icon;

  return (
    <div
      data-testid={`marketplace-row-${manifest.type}`}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg px-3 py-2 text-sm md:flex-nowrap"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2">
          <span className="font-medium text-foreground">{manifest.label}</span>
          {manifest.status === "experimental" && <ExperimentalBadge />}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {manifest.summary}
        </p>
      </div>

      {sample && (
        <p
          data-testid={`row-sample-${manifest.type}`}
          className="hidden truncate font-mono text-xs text-muted-foreground md:block md:max-w-48"
        >
          {sample}
        </p>
      )}

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant={added ? "secondary" : "outline"}
          size="icon-sm"
          aria-pressed={added}
          aria-label={added ? `${manifest.label} added` : `Add ${manifest.label}`}
          onClick={added ? onRemove : onAdd}
          className={cn(added && "text-success")}
        >
          {added ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
        <AboutPanel
          type={manifest.type}
          label={manifest.label}
          summary={manifest.summary}
          justification={manifest.justification}
          requirements={requirements}
          experimental={manifest.status === "experimental"}
          preview={<FeatureRenderer blocks={[previewBlock]} />}
        />
      </div>
    </div>
  );
}
