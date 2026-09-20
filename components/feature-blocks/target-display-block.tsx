"use client";

import {
  buildSymbolView,
  buildKeysDiagramView,
} from "@/lib/feature-blocks/target-display/render-model";
import type { TargetDisplayConfig } from "@/lib/feature-blocks/target-display/config";
import { useDrillRuntime } from "@/lib/drill-runtime";
import { useNoteStream } from "@/hooks/useNoteStream";
import type { ChordTarget } from "@/lib/drill-runtime";
import type { PracticeNote } from "@/lib/practice-note";

/**
 * The view model the display reads: when the runtime grades grouped targets
 * (an explicit target block or the source-practice fallback), those are the
 * truth — the raw stream's per-note rows would misstate position. Stream-only
 * preview pages fall back to per-note rows.
 */
type DisplayRow = {
  symbol: string;
  pcs: Set<number>;
};

function rowsFromTargets(targets: ChordTarget[]): DisplayRow[] {
  return targets.map((t) => ({ symbol: t.symbol, pcs: t.pcs }));
}

function rowsFromStream(notes: PracticeNote[]): DisplayRow[] {
  return notes.map((n) => ({ symbol: n.symbol, pcs: n.pcs }));
}

export function TargetDisplayBlock(config: TargetDisplayConfig) {
  const runtime = useDrillRuntime();
  const notes = useNoteStream();

  // The runtime owns progression; there is no local auto-advance.
  const currentIndex = runtime?.targetIndex ?? 0;
  const totalTargets = runtime?.totalTargets ?? 0;

  const rows: DisplayRow[] =
    runtime && totalTargets > 0
      ? rowsFromTargets(runtime.targets)
      : rowsFromStream(notes);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Target display (connect a source)
      </div>
    );
  }

  if (config.view === "symbols") {
    const view = buildSymbolView(rows as unknown as PracticeNote[], currentIndex, {
      showNext: config.showNext,
      showPosition: config.showPosition,
    });

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Current
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <div className="font-heading text-3xl font-bold text-primary">
              {view.current}
            </div>
          </div>
        </div>

        {view.next && (
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Next
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center text-sm text-muted-foreground">
              {view.next}
            </div>
          </div>
        )}

        {view.position && (
          <div className="text-center text-sm text-muted-foreground">
            {view.position}
          </div>
        )}
      </div>
    );
  }

  // keysDiagram view
  const view = buildKeysDiagramView(rows as unknown as PracticeNote[], currentIndex, {
    showNext: config.showNext,
    showPosition: config.showPosition,
  });

  const currentPcs = Array.from(view.current).sort((a, b) => a - b);
  const nextPcs = view.next ? Array.from(view.next).sort((a, b) => a - b) : [];
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Current
        </div>
        <div className="grid grid-cols-4 gap-1 rounded-lg border border-border bg-card p-3">
          {noteNames.map((name, i) => (
            <div
              key={i}
              className={`rounded px-2 py-1 text-center text-xs font-medium transition-colors ${
                currentPcs.includes(i)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {name}
            </div>
          ))}
        </div>
      </div>

      {nextPcs.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Next
          </div>
          <div className="grid grid-cols-4 gap-1 rounded-lg border border-border bg-muted/30 p-3">
            {noteNames.map((name, i) => (
              <div
                key={i}
                className={`rounded px-2 py-1 text-center text-xs font-medium transition-colors ${
                  nextPcs.includes(i) ? "bg-muted text-foreground/50" : "bg-transparent"
                }`}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      )}

      {view.position && (
        <div className="text-center text-sm text-muted-foreground">
          {view.position}
        </div>
      )}
    </div>
  );
}
