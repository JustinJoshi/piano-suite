"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAudio } from "@/hooks/useAudio";
import type { RestTimerConfig } from "@/lib/feature-blocks/rest-timer/config";

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

type CountdownState = {
  /** The configured length this countdown was built from. */
  seconds: number;
  remaining: number;
  running: boolean;
};

/**
 * A plain rest countdown between sets. Every practice routine worth following
 * is time-boxed, and a rest block is what lets one page hold a warm-up, a
 * rest, and the work that follows.
 */
export function RestTimerBlock({ seconds, label, chime }: RestTimerConfig) {
  const [state, setState] = useState<CountdownState>({
    seconds,
    remaining: seconds,
    running: false,
  });
  const { playChime } = useAudio();

  // Changing the length in settings rebuilds the countdown. Adjusting during
  // render (rather than in an effect) avoids a frame showing the stale value.
  if (state.seconds !== seconds) {
    setState({ seconds, remaining: seconds, running: false });
  }

  const chimeRef = useRef(chime);
  const playChimeRef = useRef(playChime);
  useEffect(() => {
    chimeRef.current = chime;
    playChimeRef.current = playChime;
  });

  useEffect(() => {
    if (!state.running) return;

    const id = setInterval(() => {
      setState((prev) => {
        if (!prev.running) return prev;
        if (prev.remaining <= 1) {
          if (chimeRef.current) playChimeRef.current();
          return { ...prev, remaining: 0, running: false };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);

    return () => clearInterval(id);
  }, [state.running]);

  const toggle = useCallback(() => {
    setState((prev) => ({
      ...prev,
      remaining: prev.remaining === 0 ? prev.seconds : prev.remaining,
      running: !prev.running,
    }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({ ...prev, remaining: prev.seconds, running: false }));
  }, []);

  const done = state.remaining === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          data-testid="rest-timer-remaining"
          className={cn(
            "font-heading text-2xl font-semibold tabular-nums",
            done && "text-success"
          )}
        >
          {formatSeconds(state.remaining)}
        </span>
      </div>

      <div className="flex gap-2">
        <Button
          data-testid="rest-timer-toggle"
          onClick={toggle}
          variant={state.running ? "secondary" : "default"}
          className="flex-1"
        >
          {state.running ? (
            <>
              <Pause className="h-4 w-4" /> Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> {done ? "Rest again" : "Start rest"}
            </>
          )}
        </Button>
        <Button
          onClick={reset}
          variant="ghost"
          size="icon"
          aria-label="Reset rest timer"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
