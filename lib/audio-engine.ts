/**
 * Browser audio engine for MIDI-driven piano sound.
 *
 * Built on `smplr`. This module is intentionally free of React; the host
 * component wires it to MIDI events and user settings.
 */

import {
  Soundfont,
  SplendidGrandPiano,
  type Soundfont as SoundfontType,
  type SplendidGrandPiano as SplendidGrandPianoType,
} from "smplr";
import type { AudioPreset } from "@/lib/audio-settings";

export type AudioEngineState =
  | "idle"
  | "loading"
  | "ready"
  | "error";

export type AudioEngine = {
  state: AudioEngineState;
  load(): Promise<void>;
  setVolume(volume: number): void;
  play(note: number, velocity: number): void;
  stop(note: number): void;
  stopAll(): void;
  dispose(): void;
};

type SamplerInstance = SplendidGrandPianoType | SoundfontType;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;

  const globalKey = "__pianoSuiteAudioCtx" as const;
  const g = globalThis as unknown as {
    [globalKey]?: AudioContext;
  };
  if (!g[globalKey]) {
    g[globalKey] = new Ctx();
  }
  return g[globalKey] ?? null;
}

function createSampler(
  context: AudioContext,
  preset: AudioPreset
): SamplerInstance {
  // Milestone 2: accept a CustomKit here to build a Soundfont2 or Sampler instance.
  switch (preset) {
    case "fluidr3-piano":
      return Soundfont(context, {
        instrument: "acoustic_grand_piano",
        kit: "FluidR3_GM",
      });
    case "musyngkite-piano":
      return Soundfont(context, {
        instrument: "acoustic_grand_piano",
        kit: "MusyngKite",
      });
    case "splendid-grand-piano":
    default:
      return SplendidGrandPiano(context);
  }
}

export type CreateAudioEngineOptions = {
  /** Called whenever the engine state changes (loading -> ready/error). */
  onStateChange?: (state: AudioEngineState) => void;
};

export function createAudioEngine(
  preset: AudioPreset,
  volume: number,
  options: CreateAudioEngineOptions = {}
): AudioEngine {
  const { onStateChange } = options;
  const context = getAudioContext();
  let state: AudioEngineState = context ? "idle" : "error";
  let sampler: SamplerInstance | null = null;
  let loadPromise: Promise<void> | null = null;

  function setState(next: AudioEngineState) {
    state = next;
    onStateChange?.(next);
  }

  function applyVolume() {
    if (sampler) {
      // smplr volume is a MIDI-style 0..127 scale.
      sampler.output.volume = Math.max(0, Math.min(1, volume)) * 127;
    }
  }

  async function ensureResumed() {
    if (context && context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        // Ignore — user gesture may still be required.
      }
    }
  }

  const load = async (): Promise<void> => {
    if (!context) {
      setState("error");
      return;
    }
    if (loadPromise) {
      await loadPromise;
      return;
    }

    setState("loading");
    loadPromise = (async () => {
      try {
        sampler = createSampler(context, preset);
        await sampler.ready;
        applyVolume();
        setState("ready");
      } catch (err) {
        console.error("Failed to load audio instrument", err);
        setState("error");
      }
    })();

    await loadPromise;
  };

  return {
    get state() {
      return state;
    },

    load,

    setVolume(next) {
      volume = next;
      applyVolume();
    },

    play(note, velocity) {
      if (!context || state === "error") return;

      void ensureResumed();

      if (state === "ready" && sampler) {
        sampler.start({
          note,
          velocity: Math.max(0, Math.min(127, Math.round(velocity))),
        });
        return;
      }

      // If not loaded yet, load now and play once ready.
      void load().then(() => {
        if (sampler) {
          sampler.start({
            note,
            velocity: Math.max(0, Math.min(127, Math.round(velocity))),
          });
        }
      });
    },

    stop(note) {
      if (!sampler || state !== "ready") return;
      sampler.stop(note);
    },

    stopAll() {
      if (!sampler || state !== "ready") return;
      sampler.stop();
    },

    dispose() {
      if (sampler && "dispose" in sampler && typeof sampler.dispose === "function") {
        sampler.dispose();
      }
      sampler = null;
      setState("idle");
      loadPromise = null;
    },
  };
}
