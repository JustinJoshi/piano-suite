/**
 * Pure rhythm pattern transformation.
 * Applies timing and duration to practice notes based on a binary onset grid.
 */

import type { PracticeNote } from "../../practice-note";
import type { RhythmPatternConfig } from "./config";

/**
 * Grid resolution: each pattern character is one 16th-note step. This is
 * what lets "1000" mean quarter notes and "10" mean eighths.
 */
const STEPS_PER_BEAT = 4;

/**
 * Parse a binary pattern string (e.g., "1010") into onset positions in beats.
 * "1" means an onset, "0" means a rest. Each character is a 16th-note step
 * and the pattern repeats for as long as the cycle runs.
 * @param pattern - Binary string like "1010"
 * @param barsPerCycle - How many bars this pattern spans
 * @param beatsPerBar - Beats per bar (default 4)
 * @returns Beat positions (fractional) where onsets occur
 */
export function gridOnsets(
  pattern: string,
  barsPerCycle: number,
  beatsPerBar: number = 4
): number[] {
  const totalSteps = barsPerCycle * beatsPerBar * STEPS_PER_BEAT;
  const onsets: number[] = [];

  for (let step = 0; step < totalSteps; step++) {
    if (pattern[step % pattern.length] === "1") {
      onsets.push(step / STEPS_PER_BEAT);
    }
  }

  return onsets;
}

/**
 * Assign onset times and durations to a list of notes based on grid onsets.
 * Notes are distributed across onsets sequentially. If there are more notes
 * than onsets, notes wrap to the next cycle.
 * @param notes - Input notes to be timed
 * @param config - Rhythm pattern config
 * @param bpm - Tempo in beats per minute (default 120)
 * @param beatsPerBar - Beats per bar (default 4)
 * @returns Notes with onsetMs and durationMs assigned
 */
export function assignOnsets(
  notes: PracticeNote[],
  config: RhythmPatternConfig,
  bpm: number = 120,
  beatsPerBar: number = 4
): PracticeNote[] {
  if (notes.length === 0) return [];

  // Combine both hands' grids into a map of beat position to hand.
  // Left wins a shared beat so an explicit LH pattern is not silently
  // overwritten by the right.
  const onsetMap = new Map<number, "left" | "right">();
  gridOnsets(config.leftPattern, config.barsPerCycle, beatsPerBar).forEach(
    (beat) => onsetMap.set(beat, "left")
  );
  gridOnsets(config.rightPattern, config.barsPerCycle, beatsPerBar).forEach(
    (beat) => onsetMap.set(beat, "right")
  );

  const sortedOnsets = Array.from(onsetMap.keys()).sort((a, b) => a - b);
  if (sortedOnsets.length === 0) return notes;

  const cycleBeats = config.barsPerCycle * beatsPerBar;
  const noteMs = (60000 / bpm) * config.durationRatio;

  return notes.map((note, idx) => {
    const onsetIdx = idx % sortedOnsets.length;
    const cycleNum = Math.floor(idx / sortedOnsets.length);
    const beatPosition = sortedOnsets[onsetIdx] + cycleNum * cycleBeats;

    return {
      ...note,
      onsetMs: (beatPosition / bpm) * 60000,
      durationMs: noteMs,
      // The grid's hand only fills notes that arrive without one, so a
      // source's own hand labeling survives the transform.
      hand: note.hand ?? onsetMap.get(sortedOnsets[onsetIdx]),
    };
  });
}

/**
 * Apply a duration ratio to notes, scaling how long each note sustains.
 * Used for articulation: 0.1 = staccato (very short), 1.0 = legato (full beat).
 * @param notes - Notes with durationMs to be scaled
 * @param ratio - Multiplier for duration (0.1 to 1.0)
 * @returns Notes with scaled durationMs
 */
export function applyDurationRatio(
  notes: PracticeNote[],
  ratio: number
): PracticeNote[] {
  return notes.map((note) => ({
    ...note,
    durationMs: note.durationMs ? note.durationMs * ratio : undefined,
  }));
}

/**
 * Transform a stream of practice notes by applying rhythm pattern timing.
 * @param notes - Input notes from a source or previous transform
 * @param config - Rhythm pattern config
 * @param bpm - Tempo (default 120)
 * @param beatsPerBar - Beats per bar (default 4)
 * @returns Notes with rhythm pattern timing applied
 */
export function transform(
  notes: PracticeNote[],
  config: RhythmPatternConfig,
  bpm: number = 120,
  beatsPerBar: number = 4
): PracticeNote[] {
  // assignOnsets already applies the duration ratio, so the transform is a
  // single pass: pitches in, timed notes out.
  return assignOnsets(notes, config, bpm, beatsPerBar);
}
