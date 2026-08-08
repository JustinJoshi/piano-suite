/**
 * Browser audio engine for MIDI-driven piano sound.
 *
 * Built on `smplr`. This module is intentionally free of React; the host
 * component wires it to MIDI events and user settings.
 */

import {
  CacheStorage,
  ElectricPiano,
  Mallet,
  Soundfont,
  SplendidGrandPiano,
  type ElectricPiano as ElectricPianoType,
  type Mallet as MalletType,
  type Sampler as SamplerType,
  type Soundfont as SoundfontType,
  type Soundfont2 as Soundfont2Type,
  type SplendidGrandPiano as SplendidGrandPianoType,
} from "smplr";
import type { AudioPreset, CustomKit } from "@/lib/audio-settings";
import { loadCustomKitBlob } from "@/lib/audio-storage";
import { createSf2Sampler } from "@/lib/sf2-kit";
import { createSampleMapSampler } from "@/lib/sample-map-kit";

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

type SamplerInstance =
  | SplendidGrandPianoType
  | SoundfontType
  | ElectricPianoType
  | MalletType
  | Soundfont2Type
  | SamplerType;

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

function getStorage() {
  if (typeof window === "undefined") return undefined;
  return CacheStorage("piano-suite");
}

function formatInstrumentName(name: string): string {
  return name.replace(/-/g, "_");
}

function createSampler(
  context: AudioContext,
  preset: AudioPreset
): SamplerInstance {
  const storage = getStorage();

  if (preset === "splendid-grand-piano") {
    return SplendidGrandPiano(context, storage ? { storage } : undefined);
  }

  // Built-in soundfont presets like "fluidr3-acoustic-grand-piano".
  for (const { prefix, kit } of [
    { prefix: "fluidr3-", kit: "FluidR3_GM" },
    { prefix: "musyngkite-", kit: "MusyngKite" },
    { prefix: "fatboy-", kit: "FatBoy" },
  ] as const) {
    if (preset.startsWith(prefix)) {
      const instrument = formatInstrumentName(preset.slice(prefix.length));
      return Soundfont(
        context,
        storage ? { instrument, kit, storage } : { instrument, kit }
      );
    }
  }

  // Dynamic soundfont preset: "sf:<kit>:<instrument>".
  if (preset.startsWith("sf:")) {
    const [, kit, instrument] = preset.split(":");
    if (!kit || !instrument) {
      throw new Error(`Invalid soundfont preset: ${preset}`);
    }
    return Soundfont(
      context,
      storage
        ? { instrument: formatInstrumentName(instrument), kit, storage }
        : { instrument: formatInstrumentName(instrument), kit }
    );
  }

  // Electric piano preset: "ep:<instrument>".
  if (preset.startsWith("ep:")) {
    const instrument = preset.slice(3);
    return ElectricPiano(
      context,
      storage ? { instrument, storage } : { instrument }
    );
  }

  // Mallet preset: "mallet:<instrument>".
  if (preset.startsWith("mallet:")) {
    const instrument = preset.slice(7);
    return Mallet(
      context,
      storage ? { instrument, storage } : { instrument }
    );
  }

  throw new Error(`Unsupported audio preset: ${preset}`);
}

async function loadCustomSampler(
  context: AudioContext,
  customKit: CustomKit
): Promise<{ sampler: SamplerInstance; objectUrls: string[] }> {
  if (customKit.kind === "sf2") {
    const blob = await loadCustomKitBlob(customKit.id);
    if (!blob) {
      throw new Error(`Custom SF2 kit not found: ${customKit.id}`);
    }
    const url = URL.createObjectURL(blob);
    try {
      const sampler = await createSf2Sampler(context, url, customKit.preset);
      return { sampler, objectUrls: [url] };
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
  }

  // Sample map kit: load each sample blob by sub-key and build a Sampler.
  const entries = await Promise.all(
    Object.entries(customKit.map).map(async ([note, sampleId]) => {
      const blob = await loadCustomKitBlob(sampleId);
      if (!blob) {
        throw new Error(`Sample not found: ${sampleId}`);
      }
      return { note: Number(note), blob, name: sampleId };
    })
  );

  const sampler = await createSampleMapSampler(context, entries);
  return { sampler, objectUrls: [] };
}

export type CreateAudioEngineOptions = {
  /** Called whenever the engine state changes (loading -> ready/error). */
  onStateChange?: (state: AudioEngineState) => void;
};

export function createAudioEngine(
  preset: AudioPreset,
  volume: number,
  customKit: CustomKit | null,
  options: CreateAudioEngineOptions = {}
): AudioEngine {
  const { onStateChange } = options;
  const context = getAudioContext();
  let state: AudioEngineState = context ? "idle" : "error";
  let sampler: SamplerInstance | null = null;
  let loadPromise: Promise<void> | null = null;
  let objectUrls: string[] = [];

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
        if (preset === "custom" && customKit) {
          const result = await loadCustomSampler(context, customKit);
          sampler = result.sampler;
          objectUrls = result.objectUrls;
        } else {
          sampler = createSampler(context, preset);
        }
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
      if (
        sampler &&
        "dispose" in sampler &&
        typeof sampler.dispose === "function"
      ) {
        sampler.dispose();
      }
      sampler = null;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      objectUrls = [];
      setState("idle");
      loadPromise = null;
    },
  };
}

/** Clear the browser's audio sample cache. */
export async function clearAudioCache(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    await window.caches.delete("piano-suite");
  } catch {
    // Ignore errors in private mode or unsupported environments.
  }
}
