/**
 * Helpers for parsing and loading user-uploaded `.sf2` soundfonts.
 */

import { Soundfont2 } from "smplr";
import type { Soundfont2 as Soundfont2Type } from "smplr";

// soundfont2's UMD build references `window` at module load, so it must be
// imported dynamically on the client.
async function loadSoundFont2Parser(): Promise<
  typeof import("soundfont2").SoundFont2
> {
  const mod = await import("soundfont2");
  return mod.SoundFont2;
}

/**
 * Parse a `.sf2` file and return the names of its presets.
 */
export async function parseSf2Instruments(
  arrayBuffer: ArrayBuffer
): Promise<string[]> {
  const SoundFont2 = await loadSoundFont2Parser();
  const data = new Uint8Array(arrayBuffer);
  const sf2 = new SoundFont2(data);
  // Preset headers carry the user-facing instrument names.
  return sf2.presets
    .map((preset) => preset.header.name.trim())
    .filter((name) => name.length > 0);
}

export type Sf2Sampler = Soundfont2Type;

/**
 * Create a smplr Soundfont2 sampler from an `.sf2` object URL and a selected preset.
 *
 * The caller owns the object URL and should revoke it once the sampler is
 * disposed.
 */
export async function createSf2Sampler(
  context: AudioContext,
  url: string,
  instrumentName: string
): Promise<Sf2Sampler> {
  const SoundFont2 = await loadSoundFont2Parser();
  const sampler = Soundfont2(context, {
    url,
    createSoundfont: (data: Uint8Array) => new SoundFont2(data),
  });
  await sampler.ready;
  await sampler.loadInstrument(instrumentName);
  return sampler;
}
