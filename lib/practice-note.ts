/**
 * The practice stream: one note event flowing from a source block through
 * transforms to a display block. This is a bare type file — no imports, no
 * React, no DOM — so it is safe for the Convex bundle.
 */
export type PracticeNote = {
  midi: number[];
  pcs: Set<number>;
  symbol: string;
  hand?: "left" | "right";
  onsetMs?: number;
  durationMs?: number;
  velocity?: number;
  /** Source musical coordinates; present only for notes from parsed MIDI files. */
  source?: SourceNoteTiming;
};

/** A tempo change in the source piece, in source ticks. */
export type SourceTempoChange = {
  tick: number;
  bpm: number;
};

/** A meter change in the source piece, in source ticks. */
export type SourceMeterChange = {
  tick: number;
  numerator: number;
  denominator: number;
};

/**
 * The musical coordinate system of the source piece. Kept beside each note
 * by shared reference (never per-note copies) so a requested bar window can
 * be recovered whole — meter changes and empty bars included — without
 * serializing into page config.
 */
export type SourceTiming = {
  /** Ticks per quarter note of the source file. */
  ppq: number;
  /** Total span of the source piece in ticks (last note or end-of-track). */
  totalTicks: number;
  /** Sorted by tick; tempo changes of the source piece. */
  tempos: readonly SourceTempoChange[];
  /** Sorted by tick; meter changes of the source piece. */
  meters: readonly SourceMeterChange[];
};

/** One note's position in the source piece's musical coordinate system. */
export type SourceNoteTiming = {
  /** Note start in source ticks. */
  tick: number;
  /** Note length in source ticks. */
  durationTicks: number;
  /** 0-based source bar the note starts in. */
  bar: number;
  /** Position inside that bar in meter beats (0-based, fractional). */
  beat: number;
  /** The piece-wide coordinate system, shared with every sibling note. */
  timing: SourceTiming;
};
