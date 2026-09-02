"use client";

import type { ReactNode } from "react";
import { SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDrillRuntime } from "@/lib/drill-runtime";
import type { TargetSourceState } from "@/hooks/useTargetSource";

/**
 * Shared chrome for every block that drives the drill runtime: the current
 * target, position in the run, miss count, and a skip button.
 *
 * Also renders the two states a target block can be in besides "live" — no
 * runtime at all (a static preview), and superseded by an earlier target
 * block on the same page.
 */
export function TargetBlockShell({
  label,
  subtitle,
  state,
  emptyMessage = "No targets configured",
  footer,
}: {
  label: string;
  subtitle?: string;
  state: TargetSourceState;
  emptyMessage?: string;
  footer?: ReactNode;
}) {
  const runtime = useDrillRuntime();

  if (!state.hasRuntime || !runtime) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {label}
      </div>
    );
  }

  if (state.isSuperseded) {
    return (
      <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          Another drill block above already owns this page&rsquo;s targets. Move
          this block first, or put it on its own practice page.
        </p>
      </div>
    );
  }

  const { currentTarget, targetIndex, totalTargets, misses } = runtime;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {Math.min(targetIndex + 1, totalTargets)} / {totalTargets}
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
          <div className="text-sm text-muted-foreground">{emptyMessage}</div>
        )}
      </div>

      {footer}

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
