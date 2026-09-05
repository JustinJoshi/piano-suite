"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeNoteRollConfig } from "@/lib/feature-blocks/note-roll/config";
import {
  visibleNotes,
  noteY,
  noteHeight,
  filterByHand,
  type RollNote,
} from "@/lib/feature-blocks/note-roll/geometry";
import { useNoteStream } from "@/hooks/useNoteStream";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useDrillRuntime } from "@/lib/drill-runtime";
import { previewNotes } from "@/lib/feature-blocks/preview-fixtures";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLL_HEIGHT_PX = 260;
const HIT_LINE_FROM_BOTTOM = 24;

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function nameOf(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

/**
 * Note roll block: a falling-notes view over a hit line. Renders the page's
 * source stream. The block library (pageId "") has no page context, so it
 * demos the fixture; a real page with no source says so instead of showing
 * fixture data that would look like targets.
 */
export function NoteRollBlock(raw: Record<string, unknown>) {
  const config = normalizeNoteRollConfig(raw);
  const runtime = useDrillRuntime();
  const stream = useNoteStream();

  // `pageId: ""` is the marketplace/library preview signal (the same
  // convention session-stats uses). previewNotes builds a fresh array on
  // every call, so it must stay inside the memo — feeding its result into
  // the dependency array would bust the animation effect every render.
  const isPreview = (runtime?.pageId ?? "") === "";
  const notes = useMemo(
    () =>
      filterByHand(
        (isPreview ? previewNotes("noteRoll") : stream) as RollNote[],
        config.handFilter
      ),
    [isPreview, stream, config.handFilter]
  );

  const [nowMs, setNowMs] = useState(0);
  const frame = useRef<number>(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const animationSuppressed = prefersReducedMotion || paused;

  // Continuous rAF loop: WCAG 2.2.2 requires a pause control, and the OS
  // reduced-motion preference must suppress it entirely (render the static
  // initial frame).
  useEffect(() => {
    if (animationSuppressed) return;

    let start = 0;
    const total = notes.reduce((max, n) => Math.max(max, n.onsetMs + (n.durationMs ?? 300)), 0) + 500;
    const tick = (t: number) => {
      if (start === 0) start = t;
      const elapsed = t - start;
      setNowMs(elapsed % total);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [notes, animationSuppressed]);

  const span = useMemo(() => {
    const all = notes.flatMap((n) => n.midi);
    if (all.length === 0) return { low: 60, high: 72 };
    return { low: Math.min(...all) - 2, high: Math.max(...all) + 2 };
  }, [notes]);

  const columns = span.high - span.low + 1;
  const visible = visibleNotes(notes, nowMs, config);

  if (!isPreview && notes.length === 0) {
    return (
      <div className="space-y-2 p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Note roll
          </span>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Note roll (connect a source)
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Note roll
        </span>
        <span className="text-xs text-muted-foreground">
          {config.handFilter === "both" ? "Both hands" : `${config.handFilter} hand`}
        </span>
        <button
          type="button"
          data-paused={paused ? "true" : "false"}
          aria-label={paused ? "Resume animation" : "Pause animation"}
          onClick={() => setPaused((p) => !p)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {paused ? (
            <Play className="h-3.5 w-3.5" />
          ) : (
            <Pause className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div
        className="relative overflow-hidden rounded-lg border border-border bg-card"
        style={{ height: ROLL_HEIGHT_PX }}
        data-testid="note-roll"
      >
        {visible.map((note, i) => {
          const y = noteY(note, nowMs, config.scrollSpeed);
          const first = note.midi[0] ?? 60;
          const col = first - span.low;
          const width = `${100 / columns}%`;
          return (
            <div
              key={`${note.symbol}-${note.onsetMs}-${i}`}
              data-testid="note-roll-note"
              className={cn(
                "absolute flex items-end justify-center rounded-sm border text-[10px] font-semibold",
                // Solid block backgrounds with their foreground tokens:
                // 10px chip text needs 4.5:1, which the 40% tints miss.
                note.hand === "left"
                  ? "border-accent/60 bg-accent text-accent-foreground"
                  : "border-primary/60 bg-primary text-primary-foreground"
              )}
              style={{
                left: `calc(${col} * ${width})`,
                width,
                bottom: HIT_LINE_FROM_BOTTOM + y,
                height: noteHeight(note, config.scrollSpeed),
              }}
            >
              {config.showNoteNames && noteHeight(note, config.scrollSpeed) > 16
                ? note.midi.map(nameOf).join(" ")
                : ""}
            </div>
          );
        })}

        {/* Hit line */}
        <div
          className="absolute inset-x-0 h-0.5 bg-success"
          style={{ bottom: HIT_LINE_FROM_BOTTOM }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Play each note as it crosses the green line. Feed it from a piece or
        scale source.
      </p>
    </div>
  );
}
