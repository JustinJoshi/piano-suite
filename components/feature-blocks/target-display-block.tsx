"use client";

import {
  buildSymbolView,
  buildKeysDiagramView,
} from "@/lib/feature-blocks/target-display/render-model";
import type { TargetDisplayConfig } from "@/lib/feature-blocks/target-display/config";
import { useDrillRuntime } from "@/lib/drill-runtime";
import { useNoteStream } from "@/hooks/useNoteStream";

export function TargetDisplayBlock(config: TargetDisplayConfig) {
  const runtime = useDrillRuntime();
  const notes = useNoteStream();

  // The runtime owns progression; there is no local auto-advance.
  const currentIndex = runtime?.targetIndex ?? 0;

  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Target display (connect a source)
      </div>
    );
  }

  if (config.view === "symbols") {
    const view = buildSymbolView(notes, currentIndex, {
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
  const view = buildKeysDiagramView(notes, currentIndex, {
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
