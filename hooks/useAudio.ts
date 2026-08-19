"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { Scheduler } from "smplr";

export type AudioOptions = {
  frequency?: number;
  duration?: number;
  attack?: number;
  decay?: number;
  type?: OscillatorType;
  volume?: number;
  /** Absolute AudioContext time at which to start the tone. */
  time?: number;
};

export type MetronomeControls = {
  start: () => void;
  stop: () => void;
  running: boolean;
};

export type MetronomeOptions = {
  /** Number of beats per bar. Defaults to 4. */
  beatsPerBar?: number;
  /** Whether the first beat of each bar is accented. Defaults to true. */
  accentFirstBeat?: boolean;
  /** Frequency of the accented beat in Hz. Defaults to 1200. */
  accentFrequency?: number;
  /** Frequency of unaccented beats in Hz. Defaults to 880. */
  normalFrequency?: number;
};

/**
 * Lazy-initialized shared AudioContext.
 *
 * Browsers require a user gesture before audio can play. This hook only
 * creates/resumes the context on the first call to `playChime`, `playTick`,
 * or `startMetronome`.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  if (!(globalThis as unknown as { __pianoSuiteAudioCtx?: AudioContext }).__pianoSuiteAudioCtx) {
    (globalThis as unknown as { __pianoSuiteAudioCtx?: AudioContext }).__pianoSuiteAudioCtx = new Ctx();
  }

  const ctx = (globalThis as unknown as { __pianoSuiteAudioCtx?: AudioContext }).__pianoSuiteAudioCtx;
  if (ctx?.state === "suspended") {
    ctx.resume().catch(() => {
      // Ignore — user gesture may still be required.
    });
  }

  return ctx ?? null;
}

function playTone(options: AudioOptions) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const {
    frequency = 1046.5,
    duration = 0.2,
    attack = 0.001,
    decay = duration * 0.9,
    type = "sine",
    volume = 0.35,
    time,
  } = options;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  const now = time ?? ctx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + attack + decay + 0.02);

  // Clean up nodes after they finish.
  setTimeout(() => {
    try {
      osc.disconnect();
      gain.disconnect();
    } catch {
      // Already disposed.
    }
  }, (attack + decay + 0.05) * 1000);
}

/**
 * Audio hook for drills.
 *
 * Provides chimes, ticks, and a lightweight metronome using the Web Audio API.
 * Keeps Tone.js optional for tools that need more advanced synthesis.
 */
export function useAudio() {
  const [ready] = useState(() => {
    if (typeof window === "undefined") return false;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    return !!Ctx;
  });
  const metronomeRef = useRef<(() => void) | null>(null);
  const [metronomeRunning, setMetronomeRunning] = useState(false);

  const playChime = useCallback((options: AudioOptions = {}) => {
    playTone({
      frequency: 1046.5,
      duration: 0.22,
      type: "sine",
      volume: 0.35,
      ...options,
    });
  }, []);

  const playTick = useCallback((options: AudioOptions = {}) => {
    playTone({
      frequency: 880,
      duration: 0.14,
      type: "sine",
      volume: 0.25,
      ...options,
    });
  }, []);

  const stopMetronome = useCallback(() => {
    if (metronomeRef.current) {
      metronomeRef.current();
      metronomeRef.current = null;
    }
    setMetronomeRunning(false);
  }, []);

  const startMetronome = useCallback(
    (
      bpm: number,
      onBeat?: (beat: number) => void,
      options: MetronomeOptions = {}
    ): MetronomeControls => {
      const ctx = getAudioContext();
      if (!ctx) {
        return { start: () => {}, stop: () => {}, running: false };
      }

      // Stop any existing metronome first.
      stopMetronome();

      const {
        beatsPerBar = 4,
        accentFirstBeat = true,
        accentFrequency = 1200,
        normalFrequency = 880,
      } = options;

      const beatInterval = 60 / bpm;
      const scheduler = Scheduler(ctx, { lookaheadMs: 25, intervalMs: 25 });
      let nextTime = ctx.currentTime;
      let beat = 0;
      const maxBeat = Math.max(1, Math.floor(beatsPerBar));

      const scheduleNext = () => {
        const currentBeat = beat;
        const currentTime = nextTime;
        scheduler.schedule({ note: 0, time: currentTime }, () => {
          const isAccent = accentFirstBeat && currentBeat === 0;
          playTone({
            frequency: isAccent ? accentFrequency : normalFrequency,
            duration: 0.08,
            type: "triangle",
            volume: 0.3,
            time: currentTime,
          });
          onBeat?.(currentBeat);
        });
        beat = (beat + 1) % maxBeat;
        nextTime += beatInterval;
      };

      // Keep the scheduler queue filled ~500ms ahead so the metronome
      // continues indefinitely. The refill loop only decides *what* to
      // schedule; actual playback timing is handled by the scheduler against
      // AudioContext.currentTime, so this setInterval does not introduce drift.
      const scheduleWindowSec = 0.5;
      const scheduleUpTo = (throughTime: number) => {
        while (nextTime < throughTime) {
          scheduleNext();
        }
      };

      scheduleUpTo(ctx.currentTime + scheduleWindowSec);

      const refillId = setInterval(() => {
        scheduleUpTo(ctx.currentTime + scheduleWindowSec);
      }, 100);

      metronomeRef.current = () => {
        clearInterval(refillId);
        scheduler.stop();
      };
      setMetronomeRunning(true);

      return {
        start: () => {},
        stop: () => {
          stopMetronome();
        },
        running: true,
      };
    },
    [stopMetronome]
  );

  useEffect(() => {
    return () => {
      if (metronomeRef.current) {
        metronomeRef.current();
      }
    };
  }, []);

  return {
    ready,
    playChime,
    playTick,
    startMetronome,
    stopMetronome,
    metronomeRunning,
  };
}
