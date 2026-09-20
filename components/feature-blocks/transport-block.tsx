"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudio } from "@/hooks/useAudio";
import type { TransportConfig } from "@/lib/feature-blocks/transport/config";
import { useDrillRuntime } from "@/lib/drill-runtime";
import { rampedBpm } from "@/lib/feature-blocks/transport/clock";

type TransportBlockProps = Partial<TransportConfig> & {
  /** When provided alongside onBpmChange, the parent controls the BPM value. */
  bpm?: number;
  /** Called when the user moves the BPM slider. Use with the controlled `bpm` prop. */
  onBpmChange?: (bpm: number) => void;
  /** Position of the block on the page; read-only, never spread onto the DOM. */
  blockId?: string;
};

/**
 * Transport block: page clock with tempo, meter, count-in, play/pause, loop, and tempo ramp controls.
 * This component manages the timing state for the entire page. The presence of a Transport
 * determines whether a page is clock-advanced.
 *
 * On a real practice page (inside a `DrillRuntimeProvider` with a page id) the
 * controls drive the shared runtime: Start/Stop map to the drill round, the
 * slider writes the runtime's live tempo override, and the displayed tempo is
 * the runtime's ramped effective BPM — the same value the audible tick plays.
 * In the standalone library preview there is no runtime, so the block keeps
 * its own local metronome and logs nothing.
 */
export function TransportBlock({
  // blockId arrives from the renderer but this block is neither a runtime
  // source nor target; it is intentionally unused and never spread to the DOM.
  bpm,
  onBpmChange,
  beatsPerBar = 4,
  countInBars = 1,
  loopEnabled = false,
  loopStartBar = 0,
  loopEndBar = 8,
  rampEnabled = false,
  rampTargetBpm = 140,
  rampOverReps = 8,
}: TransportBlockProps) {
  const runtime = useDrillRuntime();
  const isLive = !!runtime && runtime.pageId !== "";

  const isControlled = bpm !== undefined && onBpmChange !== undefined;
  const [internalBpm, setInternalBpm] = useState(bpm ?? 120);

  // The live slider position the user has chosen this session. Mirrors the
  // runtime's own override (which stays the single source of truth); cleared
  // alongside it when the saved tempo changes or the transport leaves the
  // page. The runtime clears via its transportState key compare — this mirror
  // only keeps the slider label honest.
  const savedBpmKey = `${bpm}:${isLive}`;
  const [sliderState, setSliderState] = useState({
    key: savedBpmKey,
    override: null as number | null,
  });
  if (sliderState.key !== savedBpmKey) {
    setSliderState({ key: savedBpmKey, override: null });
  }
  const sliderOverride =
    sliderState.key === savedBpmKey ? sliderState.override : null;

  const previewBpm = isControlled ? bpm : internalBpm;
  // The tempo base: in the preview the configured value; on a page the saved
  // tempo as lifted by a live slider move. The runtime's clock window and
  // stream re-derive from the same override, so they always agree.
  const baseBpm = isLive ? sliderOverride ?? bpm ?? 120 : previewBpm;

  // The effective tempo while the ramp runs: on a page the runtime owns the
  // rep count, so the block reads its position in the round and shows the
  // ramped value live — the same math the runtime applies to the clock window
  // and stream. The audible tick and the label follow through the shared
  // `effectiveBpm` below.
  const rampedDisplayBpm =
    rampEnabled && runtime && runtime.targetIndex > 0
      ? rampedBpm(baseBpm, rampTargetBpm, runtime.targetIndex, rampOverReps)
      : baseBpm;

  const [pulse, setPulse] = useState(false);

  // Audible tick goes through the shared audio primitive — the transport
  // never touches Web Audio directly.
  const { ready, startMetronome, stopMetronome, metronomeRunning } = useAudio();

  const beatCallback = useCallback(() => setPulse((p) => !p), []);

  const startPreview = useCallback(() => {
    startMetronome(previewBpm, beatCallback, {
      beatsPerBar,
      accentFirstBeat: true,
    });
  }, [startMetronome, previewBpm, beatCallback, beatsPerBar]);

  const startLive = useCallback(() => {
    if (!runtime || metronomeRunning) return;
    // Owns the round shape and the drill_started analytics (once, from the
    // click — never from an effect, so StrictMode remounts stay silent).
    runtime.start();
    startMetronome(rampedDisplayBpm, beatCallback, {
      beatsPerBar,
      accentFirstBeat: true,
    });
  }, [
    runtime,
    metronomeRunning,
    startMetronome,
    rampedDisplayBpm,
    beatCallback,
    beatsPerBar,
  ]);

  const stopLive = useCallback(() => {
    stopMetronome();
    runtime?.reset();
  }, [stopMetronome, runtime]);

  const toggle = isLive ? startLive : startPreview;

  // Keep the tick in tempo while the transport runs: a slider move or a ramp
  // step changes the effective bpm and the metronome restarts at it.
  useEffect(() => {
    if (metronomeRunning) {
      startMetronome(rampedDisplayBpm, beatCallback, {
        beatsPerBar,
        accentFirstBeat: true,
      });
    }
  }, [rampedDisplayBpm, metronomeRunning, beatsPerBar, startMetronome, beatCallback]);

  // A round reset that did not come from this block (a separate DrillTimer's
  // stop, the editor's reset) ends the audible tick too. The block's own Stop
  // already cleared the tick, so the metronome is only still running when the
  // reset came from elsewhere.
  useEffect(() => {
    if (isLive && metronomeRunning && runtime?.phase === "idle") {
      stopMetronome();
    }
  }, [isLive, metronomeRunning, runtime?.phase, stopMetronome]);

  // Unmount cleanup of ticks this block started is owned by `useAudio`'s
  // own unmount effect; the block adds none of its own.

  const setBpm = useCallback(
    (next: number) => {
      if (isLive) {
        // Lift the shared clock: the runtime's override re-times the target
        // window, the stream, and (below) this tick. Optional so preview
        // contexts without the phase-1 runtime stay type-compatible.
        runtime?.setTransportBpm?.(next);
        setSliderState((prev) => ({ ...prev, override: next }));
        return;
      }
      if (isControlled) {
        onBpmChange(next);
      } else {
        setInternalBpm(next);
      }
    },
    [isLive, isControlled, onBpmChange, runtime]
  );

  const sliderValue = isLive ? baseBpm : previewBpm;

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
              pulse && metronomeRunning
                ? "bg-primary shadow-[0_0_12px_2px_var(--primary-glow)]"
                : "bg-muted"
            )}
          />
          <span
            data-testid="tempo-display"
            className="font-heading text-2xl font-semibold tabular-nums"
          >
            {rampedDisplayBpm} BPM
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
          value={sliderValue}
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

      {/* Tempo ramp indicator: the moving effective tempo and its progress */}
      {rampEnabled && rampTargetBpm !== baseBpm && (
        <div className="rounded-lg border border-border bg-card/50 p-2">
          <div className="text-xs font-medium text-muted-foreground">
            Ramp: {baseBpm} → {rampTargetBpm} BPM over {rampOverReps} rep{rampOverReps !== 1 ? "s" : ""}
          </div>
          <div className="mt-1 h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              data-testid="ramp-progress"
              style={{
                width: `${Math.min(100, Math.max(0, ((baseBpm - (bpm ?? 120)) / (rampTargetBpm - (bpm ?? 120))) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Play/pause button */}
      <Button
        data-testid="transport-btn"
        onClick={metronomeRunning ? stopLive : toggle}
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
