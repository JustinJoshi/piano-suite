"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudio } from "@/hooks/useAudio";
import type { MetronomeConfig } from "@/lib/feature-blocks/metronome/config";

type MetronomeBlockProps = MetronomeConfig & {
  /** When provided alongside onBpmChange, the parent controls the BPM value. */
  bpm?: number;
  /** Called when the user moves the BPM slider. Use with the controlled `bpm` prop. */
  onBpmChange?: (bpm: number) => void;
};

export function MetronomeBlock({
  bpm,
  onBpmChange,
  beatsPerBar,
  accentFirstBeat,
  minBpm,
  maxBpm,
}: MetronomeBlockProps) {
  const isControlled = bpm !== undefined && onBpmChange !== undefined;
  const initialBpm = bpm ?? 120;
  const [internalBpm, setInternalBpm] = useState(initialBpm);
  const effectiveBpm = isControlled ? bpm : internalBpm;

  const setBpm = useCallback(
    (next: number) => {
      if (isControlled) {
        onBpmChange(next);
      } else {
        setInternalBpm(next);
      }
    },
    [isControlled, onBpmChange]
  );

  // Debounce the BPM that drives the running metronome so dragging the
  // slider does not restart (and audibly tick) on every pixel movement.
  const [runningBpm, setRunningBpm] = useState(effectiveBpm);
  useEffect(() => {
    const id = setTimeout(() => setRunningBpm(effectiveBpm), 150);
    return () => clearTimeout(id);
  }, [effectiveBpm]);

  const { ready, startMetronome, stopMetronome, metronomeRunning } = useAudio();
  const [pulse, setPulse] = useState(false);

  const toggle = useCallback(() => {
    if (metronomeRunning) {
      stopMetronome();
      return;
    }
    startMetronome(effectiveBpm, () => setPulse((p) => !p), {
      beatsPerBar,
      accentFirstBeat,
    });
  }, [
    metronomeRunning,
    stopMetronome,
    startMetronome,
    effectiveBpm,
    beatsPerBar,
    accentFirstBeat,
  ]);

  // Keep tempo in sync while running, but only after the user stops dragging
  // the slider. The start uses the immediate BPM so the first click feels
  // responsive; subsequent tempo changes wait for the debounce.
  useEffect(() => {
    if (metronomeRunning) {
      startMetronome(runningBpm, () => setPulse((p) => !p), {
        beatsPerBar,
        accentFirstBeat,
      });
    }
  }, [
    runningBpm,
    metronomeRunning,
    beatsPerBar,
    accentFirstBeat,
    startMetronome,
  ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Metronome
        </span>
        <div className="flex items-center gap-3">
          <div
            data-testid="pulse-dot"
            className={cn(
              "h-3 w-3 rounded-full transition-all duration-100",
              pulse && metronomeRunning
                ? "bg-primary shadow-[0_0_12px_2px_var(--primary-glow)]"
                : "bg-muted"
            )}
          />
          <span
            data-testid="bpm-display"
            className="font-heading text-2xl font-semibold"
          >
            {effectiveBpm} BPM
          </span>
        </div>
      </div>

      <input
        data-testid="bpm-slider"
        type="range"
        min={minBpm}
        max={maxBpm}
        value={effectiveBpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="w-full accent-primary"
        aria-label="Tempo"
      />

      <Button
        data-testid="metronome-btn"
        onClick={toggle}
        disabled={!ready}
        variant={metronomeRunning ? "destructive" : "default"}
        className="w-full"
      >
        {metronomeRunning ? (
          <>
            <Square className="h-4 w-4" /> Stop Metronome
          </>
        ) : (
          <>
            <Play className="h-4 w-4" /> Start Metronome
          </>
        )}
      </Button>
    </div>
  );
}
