"use client";

import { normalizeSectionLoopConfig } from "@/lib/feature-blocks/section-loop/config";
import { cn } from "@/lib/utils";

/**
 * Section loop block: compact transform UI. Shows the bar window it carves
 * out of the incoming stream and how many times it repeats it.
 */
export function SectionLoopBlock(raw: Record<string, unknown>) {
  const config = normalizeSectionLoopConfig(raw);
  const bars = config.endBar - config.startBar;

  return (
    <div className="space-y-3 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Section loop
        </span>
        <span className="text-xs text-muted-foreground">
          {config.repeats}×
        </span>
      </div>

      <div
        className="flex gap-1"
        data-testid="section-loop-bars"
        aria-label={`Bars ${config.startBar} to ${config.endBar}, repeated ${config.repeats} times`}
      >
        {Array.from({ length: bars }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 flex-1 rounded-sm border border-primary bg-primary/60",
              i === 0 && "rounded-l-full",
              i === bars - 1 && "rounded-r-full"
            )}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Loops bars {config.startBar}–{config.endBar} of this stream. Feed it a
        piece library to drill one section at a time.
      </p>
    </div>
  );
}
