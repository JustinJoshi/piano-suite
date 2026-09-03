"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudio } from "@/hooks/useAudio";
import type { TransportConfig } from "@/lib/feature-blocks/transport/config";

type TransportBlockProps = Partial<TransportConfig> & {
  /** When provided alongside onBpmChange, the parent controls the BPM value. */
  bpm?: number;
  /** Called when the user moves the BPM slider. Use with the controlled `bpm` prop. */
  onBpmChange?: (bpm: number) => void;
};

/**
 * Transport block: page clock with tempo, meter, count-in, play/pause, loop, and tempo ramp controls.
 * This component manages the timing state for the entire page. The presence of a Transport
 * determines whether a page is clock-advanced.
 */
export function TransportBlock({
  bpm,
  onBpmChange,
  beatsPerBar = 4,
  countInBars = 1,
  loopEnabled = false,
  loopStartBar = 0,
  loopEndBar = 8,
  rampEnabled = false,
  rampTargetBpm = 140,
}: TransportBlockProps) {
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

  const [isPlaying, setIsPlaying] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Audible tick goes through the shared audio primitive — the transport
  // never touches Web Audio directly.
  const { ready, startMetronome, stopMetronome, metronomeRunning } = useAudio();

  const toggle = useCallback(() => {
    if (metronomeRunning) {
      stopMetronome();
      setIsPlaying(false);
      return;
    }
    startMetronome(effectiveBpm, () => setPulse((p) => !p), {
      beatsPerBar,
      accentFirstBeat: true,
    });
    setIsPlaying(true);
  }, [
    metronomeRunning,
    stopMetronome,
    startMetronome,
    effectiveBpm,
    beatsPerBar,
  ]);

  // Keep the tick in tempo while the transport runs.
  useEffect(() => {
    if (metronomeRunning) {
      startMetronome(effectiveBpm, () => setPulse((p) => !p), {
        beatsPerBar,
        accentFirstBeat: true,
      });
    }
  }, [effectiveBpm, metronomeRunning, beatsPerBar, startMetronome]);

  return (
    <div className="space-y-4 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Transport
        </span>
        <div className="flex items-center gap-3">
          <div
            data-testid="pulse-dot"
            className={cn(
              "h-3 w-3 rounded-full transition-all duration-100",
              pulse && isPlaying
                ? "bg-primary shadow-[0_0_12px_2px_var(--primary-glow)]"
                : "bg-muted"
            )}
          />
          <span
            data-testid="tempo-display"
            className="font-heading text-2xl font-semibold tabular-nums"
          >
            {effectiveBpm} BPM
          </span>
        </div>
      </div>

      {/* Tempo slider */}
      <div className="space-y-1">
        <input
          data-testid="tempo-slider"
          type="range"
          min={30}
          max={300}
          value={effectiveBpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="Tempo"
        />
      </div>

      {/* Meter and count-in controls */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1 rounded-lg border border-border bg-card/50 p-2">
          <label className="text-xs font-medium text-muted-foreground">
            Meter
          </label>
          <div className="text-center text-xl font-semibold">{beatsPerBar}/4</div>
        </div>
        <div className="space-y-1 rounded-lg border border-border bg-card/50 p-2">
          <label className="text-xs font-medium text-muted-foreground">
            Count-in
          </label>
          <div className="text-center text-xl font-semibold">
            {countInBars > 0 ? `${countInBars} bar${countInBars !== 1 ? "s" : ""}` : "None"}
          </div>
        </div>
      </div>

      {/* Loop section display */}
      {loopEnabled && (
        <div className="rounded-lg border border-border bg-card/50 p-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Loop: bars {loopStartBar}–{loopEndBar}
          </div>
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary"
              style={{
                width: `${((loopEndBar - loopStartBar) / 128) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Tempo ramp indicator */}
      {rampEnabled && (
        <div className="rounded-lg border border-border bg-card/50 p-2">
          <div className="text-xs font-medium text-muted-foreground">
            Ramp: {effectiveBpm} → {rampTargetBpm} BPM
          </div>
        </div>
      )}

      {/* Play/pause button */}
      <Button
        data-testid="transport-btn"
        onClick={toggle}
        disabled={!ready}
        variant={metronomeRunning ? "destructive" : "default"}
        className="w-full"
      >
        {metronomeRunning ? (
          <>
            <Square className="h-4 w-4" /> Stop
          </>
        ) : (
          <>
            <Play className="h-4 w-4" /> Start
          </>
        )}
      </Button>
    </div>
  );
}
