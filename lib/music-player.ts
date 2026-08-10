/**
 * Browser music player primitives for driving Chladni Ripple and the piano
 * sound engine from uploaded songs.
 *
 * Two sources are supported:
 * - MIDI files: deterministic note events parsed with @tonejs/midi.
 * - Audio files: best-effort monophonic pitch detection via pitchfinder.
 *
 * Both sources dispatch `music-note-on` / `music-note-off` custom events on
 * `window` using the same shape as MIDI note events.
 */

import { Midi } from "@tonejs/midi";
import { YIN } from "pitchfinder";

export type MusicPlayerFileKind = "midi" | "audio";

export type MusicPlayerFile = {
  name: string;
  kind: MusicPlayerFileKind;
  /** Object URL or parsed source used by the player. */
  src: string;
  /** Duration in seconds (best-effort for audio, exact for MIDI). */
  duration: number;
};

export type MusicPlayerNote = {
  note: number;
  pc: number;
  velocity: number;
  time: number;
  duration: number;
};

export type MusicPlayerState =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "error";

export type ParsedMidi = {
  kind: "midi";
  duration: number;
  notes: MusicPlayerNote[];
};

export type ParsedAudio = {
  kind: "audio";
  duration: number;
};

export type ParsedMusic = ParsedMidi | ParsedAudio;

/** Dispatch a synthetic music note-on event on window. */
export function dispatchMusicNoteOn(note: number, velocity: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("music-note-on", {
      detail: {
        note,
        pc: ((note % 12) + 12) % 12,
        velocity: Math.max(0, Math.min(127, Math.round(velocity))),
      },
    })
  );
}

/** Dispatch a synthetic music note-off event on window. */
export function dispatchMusicNoteOff(note: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("music-note-off", {
      detail: {
        note,
        pc: ((note % 12) + 12) % 12,
        velocity: 0,
      },
    })
  );
}

function normalizeVelocity(velocity: number): number {
  return Math.max(1, Math.min(127, Math.round(velocity * 127)));
}

/**
 * Parse a MIDI ArrayBuffer into scheduled note events.
 */
export function parseMidiFile(arrayBuffer: ArrayBuffer): ParsedMidi {
  const midi = new Midi(arrayBuffer);
  const rawNotes = midi.tracks.flatMap((track) => track.notes);
  const notes: MusicPlayerNote[] = rawNotes
    .map((n) => ({
      note: n.midi,
      pc: ((n.midi % 12) + 12) % 12,
      velocity: normalizeVelocity(n.velocity),
      time: n.time,
      duration: n.duration,
    }))
    .sort((a, b) => a.time - b.time);

  const duration =
    notes.length === 0
      ? 0
      : Math.max(...notes.map((n) => n.time + n.duration));

  return { kind: "midi", duration, notes };
}

export function detectFileKind(file: File): MusicPlayerFileKind {
  const name = file.name.toLowerCase();
  if (name.endsWith(".mid") || name.endsWith(".midi")) return "midi";
  return "audio";
}

export function isSupportedAudioFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".mp3") ||
    name.endsWith(".wav") ||
    name.endsWith(".ogg") ||
    name.endsWith(".flac") ||
    name.endsWith(".m4a")
  );
}

export function isSupportedMusicFile(file: File): boolean {
  return detectFileKind(file) === "midi" || isSupportedAudioFile(file);
}

/**
 * Convert a detected frequency (Hz) to the nearest MIDI note number and
 * pitch-class.
 */
export function frequencyToNote(frequency: number): {
  note: number;
  pc: number;
  cents: number;
} | null {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  const semitones = 12 * Math.log2(frequency / 440);
  const note = Math.round(semitones + 69);
  const cents = Math.round((semitones + 69 - note) * 100);
  return {
    note,
    pc: ((note % 12) + 12) % 12,
    cents,
  };
}

/**
 * Schedule MIDI note events relative to the current moment and dispatch global
 * music-note events. Returns a function that cancels all pending timeouts.
 *
 * `progressMs` is how much of the song has already been played, so notes
 * before that time are skipped.
 */
export function scheduleMidiNotes(
  notes: readonly MusicPlayerNote[],
  progressMs: number,
  options: {
    onNoteOn?: (note: MusicPlayerNote) => void;
    onNoteOff?: (note: MusicPlayerNote) => void;
    onComplete?: () => void;
  } = {}
): () => void {
  const timeouts: ReturnType<typeof setTimeout>[] = [];

  for (const note of notes) {
    const noteOnTime = note.time * 1000 - progressMs;
    if (noteOnTime + note.duration * 1000 <= 0) continue; // already finished

    const onDelay = Math.max(0, noteOnTime);
    const onTimeout = setTimeout(() => {
      dispatchMusicNoteOn(note.note, note.velocity);
      options.onNoteOn?.(note);

      const offTimeout = setTimeout(() => {
        dispatchMusicNoteOff(note.note);
        options.onNoteOff?.(note);
      }, Math.max(0, note.duration * 1000));
      timeouts.push(offTimeout);
    }, onDelay);
    timeouts.push(onTimeout);
  }

  const lastNote = notes[notes.length - 1];
  if (lastNote) {
    const completeDelay = Math.max(
      0,
      lastNote.time * 1000 + lastNote.duration * 1000 - progressMs
    );
    const completeTimeout = setTimeout(() => {
      options.onComplete?.();
    }, completeDelay);
    timeouts.push(completeTimeout);
  }

  return () => {
    timeouts.forEach(clearTimeout);
    timeouts.length = 0;
  };
}

/**
 * Create a pitch detector for audio files.
 */
export function createPitchDetector(sampleRate: number) {
  const detectPitch = YIN({ sampleRate });
  return {
    detect(buffer: Float32Array): number | null {
      const frequency = detectPitch(buffer);
      if (frequency == null || typeof frequency !== "number") return null;
      return frequency;
    },
  };
}

/**
 * Read a File into an ArrayBuffer.
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
