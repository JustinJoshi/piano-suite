"use client";

import { useMemo } from "react";
import {
  normalizeChordLibraryConfig,
  type ChordLibraryConfig,
} from "@/lib/feature-blocks/chord-library/config";
import { generateChords } from "@/lib/feature-blocks/chord-library/generate";

/** Render the voicing's actual MIDI notes under each symbol. */
function noteNames(midi: number[]): string {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return midi.map((m) => names[m % 12]).join(" ");
}

/**
 * Chord library block: source UI. Runs the generator live so the user sees
 * the exact chord stream their config produces, ready to feed a display.
 */
export function ChordLibraryBlock(raw: Record<string, unknown>) {
  const config: ChordLibraryConfig = normalizeChordLibraryConfig(raw);
  const chords = useMemo(() => generateChords(config), [config]);

  return (
    <div className="space-y-3 p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Chord library
        </span>
        <span className="text-xs text-muted-foreground">
          {config.voicing === "closed" ? "Closed" : `Rootless ${config.voicing.slice(-1).toUpperCase()}`}
        </span>
      </div>

      {chords.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-center text-sm text-muted-foreground">
          No chords yet — enter symbols like Cmaj7 or numerals like ii V I.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2" data-testid="chord-stream">
          {chords.slice(0, 12).map((chord, i) => (
            <li
              key={`${chord.symbol}-${i}`}
              className="rounded-md border border-border bg-card px-2 py-1 text-center"
            >
              <div className="text-sm font-semibold text-primary">{chord.symbol}</div>
              <div className="font-mono text-[10px] text-muted-foreground">
                {noteNames(chord.midi)}
              </div>
            </li>
          ))}
          {chords.length > 12 && (
            <li className="self-center text-xs text-muted-foreground">
              +{chords.length - 12} more
            </li>
          )}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        {chords.length} chord{chords.length === 1 ? "" : "s"} in the stream. Feed
        a target display or note roll to practice them.
      </p>
    </div>
  );
}
