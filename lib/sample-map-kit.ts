/**
 * Helpers for parsing and loading user-uploaded per-note sample maps.
 *
 * Supports individual audio files and .zip archives. Filenames are mapped to
 * MIDI note numbers by note name ("C4", "F#3") or raw number ("60.wav").
 */

import JSZip from "jszip";
import { Sampler } from "smplr";
import type { Sampler as SamplerType } from "smplr";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SAMPLE_EXTENSIONS = [".wav", ".wave", ".mp3", ".ogg", ".m4a", ".flac"];

function normalizeNotePart(part: string): string {
  return part
    .replace("Db", "C#")
    .replace("Eb", "D#")
    .replace("Gb", "F#")
    .replace("Ab", "G#")
    .replace("Bb", "A#");
}

function noteNameToMidi(note: string): number | null {
  const match = note.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!match) return null;

  const name = normalizeNotePart(match[1]!);
  const octave = Number(match[2]);
  const index = NOTE_NAMES.indexOf(name);
  if (index === -1) return null;

  // C4 = 60
  return index + (octave + 1) * 12;
}

function filenameToMidiNote(filename: string): number | null {
  const base = filename.replace(/\\/g, "/").split("/").pop() ?? filename;
  const withoutExt = base.replace(/\.[^.]+$/, "");

  // Try numeric first, e.g. "60" or "060".
  if (/^\d{1,3}$/.test(withoutExt)) {
    const n = Number(withoutExt);
    if (n >= 0 && n <= 127) return n;
  }

  // Note name, e.g. "C4", "F#3", "Bb5".
  return noteNameToMidi(withoutExt);
}

function isAudioFile(name: string): boolean {
  const lower = name.toLowerCase();
  return SAMPLE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export type SampleMapEntry = {
  note: number;
  blob: Blob;
  name: string;
};

/**
 * Extract note-numbered audio files from a list of Files.
 * If a .zip file is included, its audio entries are unpacked and merged.
 */
export async function parseSampleFiles(
  files: File[]
): Promise<SampleMapEntry[]> {
  const entries: SampleMapEntry[] = [];
  const zipPromises: Promise<SampleMapEntry[]>[] = [];

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      zipPromises.push(parseZipSampleFile(file));
      continue;
    }

    if (!isAudioFile(file.name)) continue;
    const note = filenameToMidiNote(file.name);
    if (note == null) continue;
    entries.push({ note, blob: file, name: file.name });
  }

  const fromZips = await Promise.all(zipPromises);
  return [...entries, ...fromZips.flat()];
}

async function parseZipSampleFile(file: File): Promise<SampleMapEntry[]> {
  const zip = await JSZip.loadAsync(file);
  const entries: SampleMapEntry[] = [];

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    if (!isAudioFile(path)) continue;
    const note = filenameToMidiNote(path);
    if (note == null) continue;
    const blob = await zipEntry.async("blob");
    entries.push({ note, blob, name: path.split("/").pop() ?? path });
  }

  return entries;
}

export type SampleMapSampler = SamplerType;

/**
 * Build a smplr Sampler from decoded sample blobs.
 */
export async function createSampleMapSampler(
  context: AudioContext,
  entries: SampleMapEntry[]
): Promise<SampleMapSampler> {
  const buffers: Record<string, AudioBuffer> = {};

  await Promise.all(
    entries.map(async (entry) => {
      const arrayBuffer = await entry.blob.arrayBuffer();
      try {
        const audioBuffer = await context.decodeAudioData(arrayBuffer);
        buffers[String(entry.note)] = audioBuffer;
      } catch {
        // Ignore files that fail to decode.
      }
    })
  );

  if (Object.keys(buffers).length === 0) {
    throw new Error("No valid audio samples could be decoded.");
  }

  const sampler = Sampler(context, { buffers });
  await sampler.ready;
  return sampler;
}
