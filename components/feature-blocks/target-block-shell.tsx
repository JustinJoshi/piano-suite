"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDrillRuntime } from "@/lib/drill-runtime";
import { useMidi } from "@/hooks/useMidi";
import { noteName } from "@/lib/music-theory";
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
  const { heldNotes } = useMidi();
  const heldNotesDisplay = useMemo(
    () => heldNotes.map((n) => noteName(((n % 12) + 12) % 12)),
    [heldNotes]
  );

  if (!state.hasRuntime || !runtime) {
    return (
      <div className="staff-lines rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {label}
      </div>
    );
  }

  if (state.isSuperseded) {
    return (
      <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          Another drill block above already owns this page&rsquo;s targets. Move
          this block first, or put it on its own practice page.
        </p>
      </div>
    );
  }

  const { currentTarget, targetIndex, totalTargets, misses } = runtime;
  const position = Math.min(targetIndex + 1, totalTargets);
  const progress = totalTargets > 0 ? position / totalTargets : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </span>
          {subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {position} / {totalTargets}
        </span>
      </div>

      {/* The score: current target on a staff, with a measure progress rule */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-elevated shadow-surface">
        <div
          aria-hidden
          className="staff-lines staff-lines-faded pointer-events-none absolute inset-0"
        />
        <div className="relative px-6 py-7 text-center">
          {currentTarget ? (
            <>
              <div className="font-heading text-5xl font-semibold tracking-tight text-foreground">
                {currentTarget.symbol}
              </div>
              <div className="mt-3 inline-block rounded-md border border-border bg-card px-3 py-1 font-mono text-sm tracking-[0.2em] text-foreground/85">
                {currentTarget.notes.join(" ")}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">{emptyMessage}</div>
          )}
        </div>
        <div className="relative h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {heldNotesDisplay.length > 0
          ? `Holding: ${heldNotesDisplay.join(" ")}`
          : "No keys held"}
      </div>

      {footer}

      <div className="flex items-center justify-between">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium",
            misses > 0 ? "text-destructive" : "text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              misses > 0 ? "bg-destructive" : "bg-muted-foreground/50"
            )}
          />
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
