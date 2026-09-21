/**
 * Pure piece-library adaptation. Converts `parseMidiFile` output (already
 * shipped by the music-player primitive) into PracticeNote sequences. This
 * module is an adapter, not a parser — no new MIDI decoding happens here.
 */

import { tickToBarBeat } from "../../midi-musical-time";
import type { MusicPlayerNote, ParsedMidi } from "../../music-player";
import type { PracticeNote, SourceTiming } from "../../practice-note";
import type { PieceLibraryConfig } from "./config";

const MS_PER_SECOND = 1000;

/**
 * Explicit assignment of original MIDI tracks to hands. `null` means
 * "unassigned" — hands are never guessed from pitch.
 */
export type HandAssignment = {
  leftTrack: number | null;
  rightTrack: number | null;
};

/** Convert one music-player note into a PracticeNote. */
export function adaptNote(
  note: MusicPlayerNote,
  transpose: number,
  timing?: SourceTiming,
  hand?: "left" | "right"
): PracticeNote {
  const midi = note.note + transpose;
  const adapted: PracticeNote = {
    midi: [midi],
    pcs: new Set([((midi % 12) + 12) % 12]),
    symbol: "",
    ...(hand ? { hand } : {}),
    onsetMs: note.time * MS_PER_SECOND,
    durationMs: note.duration * MS_PER_SECOND,
    velocity: note.velocity,
  };

  if (
    !timing ||
    typeof note.ticks !== "number" ||
    typeof note.durationTicks !== "number"
  ) {
    return adapted;
  }

  // Source musical coordinates share one piece-wide timing object; never
  // mutate it or the parsed source notes.
  const position = tickToBarBeat(timing, note.ticks);
  if (!position) return adapted;

  return {
    ...adapted,
    source: {
      tick: note.ticks,
      durationTicks: note.durationTicks,
      bar: position.bar,
      beat: position.beat,
      timing,
    },
  };
}

/**
 * Adapt a parsed MIDI file into the page's practice stream.
 * Returns notes sorted by onset so the roll and transport read naturally.
 */
export function notesFromParsedMidi(
  parsed: ParsedMidi,
  config: PieceLibraryConfig,
  assignment?: HandAssignment
): PracticeNote[] {
  if (
    assignment &&
    assignment.leftTrack !== null &&
    assignment.leftTrack === assignment.rightTrack
  ) {
    throw new Error(
      "Invalid hand assignment: the same track cannot belong to both hands"
    );
  }
  const handFor = (note: MusicPlayerNote): "left" | "right" | undefined => {
    if (!assignment) return undefined;
    if (assignment.leftTrack !== null && note.trackIndex === assignment.leftTrack)
      return "left";
    if (
      assignment.rightTrack !== null &&
      note.trackIndex === assignment.rightTrack
    )
      return "right";
    return undefined;
  };
  // Notes with no assigned hand are dropped only when filtering one hand;
  // "both" keeps every note regardless of assignment.
  const filterHand = config.handFilter === "both" ? undefined : config.handFilter;
  const notes = parsed.notes
    .filter((note) => filterHand === undefined || handFor(note) === filterHand)
    .map((note) =>
      adaptNote(note, config.transpose, parsed.timing, handFor(note))
    )
    .sort((a, b) => (a.onsetMs ?? 0) - (b.onsetMs ?? 0));

  if (config.role === "accompaniment") {
    // Nothing downstream grades either role today; the distinction is only the symbol.
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
