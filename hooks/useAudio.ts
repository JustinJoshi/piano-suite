"use client";

import { useRef, useCallback, useState, useEffect } from "react";

export type AudioOptions = {
  frequency?: number;
  duration?: number;
  attack?: number;
  decay?: number;
  type?: OscillatorType;
  volume?: number;
};

export type MetronomeControls = {
  start: () => void;
  stop: () => void;
  running: boolean;
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
  } = options;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  const now = ctx.currentTime;
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
  const metronomeRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const startMetronome = useCallback(
    (bpm: number, onBeat?: (beat: number) => void): MetronomeControls => {
      const ctx = getAudioContext();
      if (!ctx) {
        return { start: () => {}, stop: () => {}, running: false };
      }

      let beat = 0;
      const intervalMs = (60 / bpm) * 1000;

      const tick = () => {
        playTone({
          frequency: beat === 0 ? 1200 : 880,
          duration: 0.08,
          type: "triangle",
          volume: 0.3,
        });
        onBeat?.(beat);
        beat = (beat + 1) % 4;
      };

      // Stop any existing metronome first.
      if (metronomeRef.current) {
        clearInterval(metronomeRef.current);
      }

      tick();
      metronomeRef.current = setInterval(tick, intervalMs);
      setMetronomeRunning(true);

      return {
        start: () => {},
        stop: () => {
          if (metronomeRef.current) {
            clearInterval(metronomeRef.current);
            metronomeRef.current = null;
          }
          setMetronomeRunning(false);
        },
        running: true,
      };
    },
    []
  );

  const stopMetronome = useCallback(() => {
    if (metronomeRef.current) {
      clearInterval(metronomeRef.current);
      metronomeRef.current = null;
    }
    setMetronomeRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (metronomeRef.current) {
        clearInterval(metronomeRef.current);
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
