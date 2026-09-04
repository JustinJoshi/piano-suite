/**
 * Pure piece-library adaptation. Converts `parseMidiFile` output (already
 * shipped by the music-player primitive) into PracticeNote sequences. This
 * module is an adapter, not a parser — no new MIDI decoding happens here.
 */

import type { MusicPlayerNote, ParsedMidi } from "../../music-player";
import type { PracticeNote } from "../../practice-note";
import type { PieceLibraryConfig } from "./config";

const MS_PER_SECOND = 1000;

/** Convert one music-player note into a PracticeNote. */
export function adaptNote(note: MusicPlayerNote, transpose: number): PracticeNote {
  const midi = note.note + transpose;
  return {
    midi: [midi],
    pcs: new Set([((midi % 12) + 12) % 12]),
    symbol: "",
    onsetMs: note.time * MS_PER_SECOND,
    durationMs: note.duration * MS_PER_SECOND,
    velocity: note.velocity,
  };
}

/**
 * Adapt a parsed MIDI file into the page's practice stream.
 * Returns notes sorted by onset so the roll and transport read naturally.
 */
export function notesFromParsedMidi(
  parsed: ParsedMidi,
  config: PieceLibraryConfig
): PracticeNote[] {
  const notes = parsed.notes
    .map((note) => adaptNote(note, config.transpose))
    .sort((a, b) => (a.onsetMs ?? 0) - (b.onsetMs ?? 0));

  if (config.role === "accompaniment") {
    // The backing track is context, not content: nothing downstream grades it.
    return notes.map((note) => ({ ...note, symbol: "acc" }));
  }
  return notes;
}

/** Total duration of the adapted stream in milliseconds. */
export function streamDurationMs(notes: PracticeNote[]): number {
  return notes.reduce(
    (max, note) => Math.max(max, (note.onsetMs ?? 0) + (note.durationMs ?? 0)),
    0
  );
}
