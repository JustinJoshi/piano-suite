"use client";

import { useEffect } from "react";
import { SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDrillRuntime } from "@/lib/drill-runtime";
import { useChordTargets } from "@/hooks/useChordTargets";
import type { ChordSetConfig } from "@/lib/feature-blocks/chord-set/config";

export function ChordSetBlock(config: ChordSetConfig) {
  const runtime = useDrillRuntime();
  const { targets, total } = useChordTargets({
    roots: config.roots,
    qualityGroups: config.qualityGroups,
    order: config.order,
  });

  useEffect(() => {
    runtime?.setTargets(targets);
  }, [targets, runtime]);

  if (!runtime) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Chord set target
      </div>
    );
  }

  const { currentTarget, targetIndex, misses } = runtime;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Chord target
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.min(targetIndex + 1, total)} / {total}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-center">
        {currentTarget ? (
          <>
            <div className="font-heading text-4xl font-semibold">
              {currentTarget.symbol}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {currentTarget.notes.join(" ")}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">No targets configured</div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div
          className={cn(
            "text-sm font-medium",
            misses > 0 ? "text-destructive" : "text-muted-foreground"
          )}
        >
          Misses: {misses}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => runtime.skipTarget()}
          disabled={!currentTarget}
        >
          <SkipForward className="mr-2 h-4 w-4" />
          Skip
        </Button>
      </div>
    </div>
  );
}
