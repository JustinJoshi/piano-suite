/**
 * Pure rhythm pattern transformation.
 * Applies timing and duration to practice notes based on a binary onset grid.
 */

import type { PracticeNote } from "../preview-fixtures";
import type { RhythmPatternConfig } from "./config";

/**
 * Parse a binary pattern string (e.g., "1010") into onset positions.
 * "1" means an onset, "0" means a rest.
 * @param pattern - Binary string like "1010"
 * @param barsPerCycle - How many bars this pattern spans
 * @param beatsPerBar - Beats per bar (default 4)
 * @returns Array of beat positions where onsets occur
 */
export function gridOnsets(
  pattern: string,
  barsPerCycle: number,
  beatsPerBar: number = 4
): number[] {
  const totalBeats = barsPerCycle * beatsPerBar;
  const onsets: number[] = [];

  // Repeat the pattern to cover the full duration
  const repeatedPattern = pattern.repeat(Math.ceil(totalBeats / pattern.length));

  for (let i = 0; i < totalBeats && i < repeatedPattern.length; i++) {
    if (repeatedPattern[i] === "1") {
      onsets.push(i);
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

  // Get onsets for both hands
  const leftOnsets = gridOnsets(config.leftPattern, config.barsPerCycle, beatsPerBar);
  const rightOnsets = gridOnsets(config.rightPattern, config.barsPerCycle, beatsPerBar);

  // Combine into a map of beat position to hand (left = 0, right = 1)
  const onsetMap = new Map<number, "left" | "right">();
  leftOnsets.forEach((beat) => onsetMap.set(beat, "left"));
  rightOnsets.forEach((beat) => {
    // If both hands have the same beat, prefer right (can be refined later)
    onsetMap.set(beat, "right");
  });

  const sortedOnsets = Array.from(onsetMap.keys()).sort((a, b) => a - b);
  const durationMs = applyDurationRatio([{ onsetMs: 0, durationMs: 1000 }], config.durationRatio)[0]
    .durationMs;

  return notes.map((note, idx) => {
    const onsetIdx = idx % sortedOnsets.length;
    const cycleNum = Math.floor(idx / sortedOnsets.length);
    const beatPosition = sortedOnsets[onsetIdx] + cycleNum * config.barsPerCycle * beatsPerBar;
    const onsetMs = (beatPosition / bpm) * 60000;

    return {
      ...note,
      onsetMs,
      durationMs,
      hand: onsetMap.get(sortedOnsets[onsetIdx]),
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
  if (notes.length === 0) return [];

  // Assign onsets based on the grid pattern
  const timedNotes = assignOnsets(notes, config, bpm, beatsPerBar);

  // Apply the duration ratio for articulation
  return applyDurationRatio(timedNotes, config.durationRatio);
}
