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
import { cn } from "@/lib/utils";

const ROLL_HEIGHT_PX = 260;
const HIT_LINE_FROM_BOTTOM = 24;

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function nameOf(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

/**
 * Note roll block: a falling-notes view over a hit line. Renders the page's
 * source stream; empty until a source block feeds the runtime.
 */
export function NoteRollBlock(raw: Record<string, unknown>) {
  const config = normalizeNoteRollConfig(raw);
  const stream = useNoteStream();
  const notes = useMemo(
    () => filterByHand(stream as RollNote[], config.handFilter),
    [stream, config.handFilter]
  );

  const [nowMs, setNowMs] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
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
  }, [notes]);

  const span = useMemo(() => {
    const all = notes.flatMap((n) => n.midi);
    if (all.length === 0) return { low: 60, high: 72 };
    return { low: Math.min(...all) - 2, high: Math.max(...all) + 2 };
  }, [notes]);

  const columns = span.high - span.low + 1;
  const visible = visibleNotes(notes, nowMs, config);

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Note roll
        </span>
        <span className="text-xs text-muted-foreground">
          {config.handFilter === "both" ? "Both hands" : `${config.handFilter} hand`}
        </span>
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
              className={cn(
                "absolute flex items-end justify-center rounded-sm border text-[10px] font-semibold",
                note.hand === "left"
                  ? "border-accent/60 bg-accent/40 text-accent"
                  : "border-primary/60 bg-primary/40 text-primary"
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
