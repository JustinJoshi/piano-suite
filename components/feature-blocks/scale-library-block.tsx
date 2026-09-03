"use client";

import { useMemo } from "react";
import {
  normalizeScaleLibraryConfig,
  type ScaleLibraryConfig,
} from "@/lib/feature-blocks/scale-library/config";
import { generateScale } from "@/lib/feature-blocks/scale-library/generate";
import { scaleRunLabel } from "@/lib/scales";

/**
 * Scale library block: source UI. Runs the generator live so the user sees
 * the exact note sequence their config produces.
 */
export function ScaleLibraryBlock(raw: Record<string, unknown>) {
  const config: ScaleLibraryConfig = normalizeScaleLibraryConfig(raw);
  const notes = useMemo(() => generateScale(config), [config]);

  return (
    <div className="space-y-3 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Scale library
        </span>
        <span className="text-xs text-muted-foreground">
          {scaleRunLabel(config.root, config.scale, config.span)}
          {config.pattern === "custom" ? " · cell" : ""}
        </span>
      </div>

      {notes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-center text-sm text-muted-foreground">
          No notes yet — pick a scale and root.
        </p>
      ) : (
        <div
          className="flex flex-wrap gap-1"
          data-testid="scale-stream"
        >
          {notes.slice(0, 24).map((note, i) => (
            <span
              key={`${note.symbol}-${i}`}
              className="rounded border border-border bg-card px-1.5 py-0.5 font-mono text-xs text-foreground"
            >
              {note.symbol}
            </span>
          ))}
          {notes.length > 24 && (
            <span className="self-center text-xs text-muted-foreground">
              +{notes.length - 24}
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {notes.length} note{notes.length === 1 ? "" : "s"}
        {config.hands === "both" ? ", both hands" : `, ${config.hands} hand`}.
        Feed a target display or note roll to practice it.
      </p>
    </div>
  );
}
