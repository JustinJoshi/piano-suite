"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  normalizeFreePlayConfig,
  type FreePlayConfig,
} from "@/lib/feature-blocks/free-play/config";
import {
  inScaleRatio,
  notesPerSecond,
  pcHistogram,
  pitchRange,
  scalePcsFor,
  type PitchRange,
} from "@/lib/feature-blocks/free-play/analysis";
import { useMidi } from "@/hooks/useMidi";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
/** How often the readouts refresh while playing. */
const TICK_MS = 500;

type FreePlayStats = {
  inScale: number;
  density: number;
  range: PitchRange | null;
  histogram: Map<number, number>;
  recentCount: number;
};

const EMPTY_STATS: FreePlayStats = {
  inScale: 1,
  density: 0,
  range: null,
  histogram: new Map(),
  recentCount: 0,
};

function Readout({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-heading text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/**
 * Free play scope: no targets, no grading. Watches the shared MIDI session
 * (hardware and on-screen keyboard both feed it) and characterizes what you
 * play against the configured scale.
 */
export function FreePlayBlock(raw: Record<string, unknown>) {
  const config: FreePlayConfig = normalizeFreePlayConfig(raw);
  const { heldNotes, connected, virtualActive } = useMidi();

  // Rolling buffer of note-on timestamps for the density readout. The
  // session store dispatches `midi-note-on` on window for every source.
  // All ref reads and clock calls happen inside effects, never at render.
  const onsetsRef = useRef<number[]>([]);
  const [stats, setStats] = useState<FreePlayStats>(EMPTY_STATS);

  const scalePcs = useMemo(
    () => scalePcsFor(config.scale, config.root),
    [config.scale, config.root]
  );

  useEffect(() => {
    function recompute() {
      const now = Date.now();
      const windowMs = config.windowSeconds * 1000;
      onsetsRef.current = onsetsRef.current.filter((t) => t > now - windowMs);
      const heldPcs = heldNotes.map((n) => ((n % 12) + 12) % 12);
      setStats({
        inScale: inScaleRatio(heldPcs, scalePcs),
        density: notesPerSecond(onsetsRef.current, windowMs, now),
        range: pitchRange(heldNotes),
        histogram: pcHistogram(heldNotes),
        recentCount: onsetsRef.current.length,
      });
    }

    function onNoteOn() {
      onsetsRef.current.push(Date.now());
    }

    recompute();
    window.addEventListener("midi-note-on", onNoteOn);
    const interval = setInterval(recompute, TICK_MS);
    return () => {
      window.removeEventListener("midi-note-on", onNoteOn);
      clearInterval(interval);
    };
  }, [heldNotes, scalePcs, config.windowSeconds]);

  const histogramEntries = [...stats.histogram.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxCount = Math.max(1, ...histogramEntries.map(([, n]) => n));

  return (
    <div className="space-y-3 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Free play
        </span>
        <span className="text-xs text-muted-foreground">
          {connected ? "MIDI" : virtualActive ? "On-screen" : "No input"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2" data-testid="free-play-readouts">
        <Readout
          label={`In ${config.root} ${config.scale}`}
          value={`${Math.round(stats.inScale * 100)}%`}
        />
        <Readout label="Notes/sec" value={stats.density.toFixed(1)} />
        <Readout
          label="Range"
          value={
            stats.range
              ? `${NOTE_NAMES[stats.range.low % 12]}–${NOTE_NAMES[stats.range.high % 12]}`
              : "—"
          }
        />
        <Readout
          label={`Notes in ${config.windowSeconds}s`}
          value={String(stats.recentCount)}
        />
      </div>

      {histogramEntries.length > 0 && (
        <div className="flex items-end gap-1" data-testid="free-play-histogram">
          {histogramEntries.map(([pc, count]) => (
            <div key={pc} className="flex-1 text-center">
              <div
                className="rounded-t bg-primary/60"
                style={{ height: `${(count / maxCount) * 40 + 4}px` }}
              />
              <div className="text-[9px] text-muted-foreground">
                {NOTE_NAMES[pc]}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Nothing to get right or wrong — play. Notes outside the scale are not
        mistakes; they are colors.
      </p>
    </div>
  );
}
