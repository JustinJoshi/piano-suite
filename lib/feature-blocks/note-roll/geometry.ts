/**
 * Pure note-roll geometry. Maps timed notes to vertical roll coordinates:
 * notes fall toward a hit line as `nowMs` advances. No React, no DOM.
 */

export type RollNote = {
  midi: number[];
  onsetMs: number;
  durationMs?: number;
  hand?: "left" | "right";
  symbol: string;
};

export type RollConfig = {
  /** Window of time shown above the hit line. */
  lookaheadMs: number;
  /** Pixels scrolled per second. */
  scrollSpeed: number;
};

/** Pixels traveled per millisecond. */
export function pxPerMs(scrollSpeed: number): number {
  return scrollSpeed / 1000;
}

/**
 * Keep only notes that are on screen: not yet fully scrolled past, and
 * within the lookahead window. `lookaheadS` bounds how far ahead a note
 * can sit at the top of the view.
 */
export function visibleNotes(
  notes: RollNote[],
  nowMs: number,
  config: RollConfig
): RollNote[] {
  return notes.filter((note) => {
    const end = note.onsetMs + (note.durationMs ?? 300);
    return end >= nowMs && note.onsetMs <= nowMs + config.lookaheadMs;
  });
}

/**
 * Y offset of a note relative to the hit line, in pixels. Negative means
 * above the line (not yet reached); zero means at the line; positive means
 * already passed.
 */
export function noteY(
  note: RollNote,
  nowMs: number,
  scrollSpeed: number
): number {
  return (nowMs - note.onsetMs) * pxPerMs(scrollSpeed);
}

/** Height of a note rectangle in pixels from its duration. */
export function noteHeight(
  note: RollNote,
  scrollSpeed: number
): number {
  return Math.max(8, (note.durationMs ?? 300) * pxPerMs(scrollSpeed));
}

/** Filter a roll's notes by hand. `both` keeps everything. */
export function filterByHand(
  notes: RollNote[],
  handFilter: "both" | "left" | "right"
): RollNote[] {
  if (handFilter === "both") return notes;
  return notes.filter((note) => note.hand === handFilter);
}
