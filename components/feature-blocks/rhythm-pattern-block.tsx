"use client";

import { normalizeRhythmPatternConfig } from "@/lib/feature-blocks/rhythm-pattern/config";
import { gridOnsets } from "@/lib/feature-blocks/rhythm-pattern/transform";
import { cn } from "@/lib/utils";

const GRID_CELLS = 8;

function OnsetStrip({
  label,
  pattern,
  tone,
}: {
  label: string;
  pattern: string;
  tone: "left" | "right";
}) {
  const onsets = new Set(gridOnsets(pattern, 2));

  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex gap-1" data-testid={`${tone}-strip`}>
        {Array.from({ length: GRID_CELLS }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 flex-1 rounded-sm border",
              onsets.has(i)
                ? tone === "left"
                  ? "border-primary bg-primary/60"
                  : "border-accent bg-accent/60"
                : "border-border bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Rhythm pattern block: compact transform UI. Shows the per-hand onset
 * grids it applies to whatever stream a source feeds it.
 */
export function RhythmPatternBlock(raw: Record<string, unknown>) {
  const config = normalizeRhythmPatternConfig(raw);

  return (
    <div className="space-y-3 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Rhythm pattern
        </span>
        <span className="text-xs text-muted-foreground">
          {config.durationRatio < 0.5
            ? "Staccato"
            : config.durationRatio > 0.9
              ? "Legato"
              : "Detached"}
        </span>
      </div>

      <OnsetStrip label="Left hand" pattern={config.leftPattern} tone="left" />
      <OnsetStrip label="Right hand" pattern={config.rightPattern} tone="right" />

      <p className="text-xs text-muted-foreground">
        Times incoming notes on this {config.barsPerCycle}-bar grid. Feed it a
        scale or chord source to make a rhythmic drill.
      </p>
    </div>
  );
}
