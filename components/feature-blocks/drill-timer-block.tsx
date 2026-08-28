"use client";

import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDrillRuntime } from "@/lib/drill-runtime";
import type { DrillTimerConfig } from "@/lib/feature-blocks/drill-timer/config";

export function DrillTimerBlock(config: DrillTimerConfig) {
  const runtime = useDrillRuntime();

  if (!runtime) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Drill timer
      </div>
    );
  }

  const { phase, liveMs, countdownValue, breakRemaining, start, reset } = runtime;
  const { showLiveTimer } = config;

  function formatMs(ms: number) {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}s`;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Drill timer
        </span>
        <PhaseBadge phase={phase} />
      </div>

      <div className="flex min-h-[4rem] items-center justify-center rounded-xl border border-border bg-card py-4">
        {phase === "idle" && (
          <span className="text-sm text-muted-foreground">Press start to begin</span>
        )}
        {phase === "countdown" && (
          <span className="font-heading text-4xl font-semibold">
            {countdownValue}
          </span>
        )}
        {phase === "armed" && (
          <span className="text-sm text-muted-foreground">Play when ready</span>
        )}
        {(phase === "timing" || phase === "success") && showLiveTimer && (
          <span className="font-heading text-4xl font-semibold">
            {formatMs(liveMs)}
          </span>
        )}
        {phase === "break-before-grade" && (
          <span className="font-heading text-4xl font-semibold">
            {breakRemaining}
          </span>
        )}
        {phase === "finished" && (
          <span className="text-sm text-muted-foreground">Finished</span>
        )}
      </div>

      <div className="flex gap-2">
        {phase === "idle" || phase === "finished" ? (
          <Button onClick={start} className="w-full">
            <Play className="mr-2 h-4 w-4" />
            {phase === "finished" ? "Restart" : "Start"}
          </Button>
        ) : (
          <Button onClick={reset} variant="outline" className="w-full">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  const labels: Record<string, string> = {
    idle: "Idle",
    countdown: "Countdown",
    armed: "Armed",
    timing: "Timing",
    success: "Success",
    "break-before-grade": "Break",
    finished: "Finished",
  };

  return (
    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {labels[phase] ?? phase}
    </span>
  );
}
