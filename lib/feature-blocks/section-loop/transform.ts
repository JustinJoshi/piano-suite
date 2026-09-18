/**
 * Pure section loop transformation.
 * Keeps the notes inside a bar window, rebases the window to start at 0,
 * then repeats it — practise bars N–M instead of the whole piece.
 */

import type { PracticeNote } from "../../practice-note";
import { sectionRange } from "../transport/clock";
import type { SectionLoopConfig } from "./config";

/**
 * Transform a stream of practice notes by looping the bar window
 * [startBar, endBar) `repeats` times. Notes whose onset falls outside the
 * window are dropped; notes with no onset pass through untouched at the
 * front, in order.
 * @param notes - Input notes from a source or previous transform
 * @param config - Section loop config
 * @param bpm - Tempo (default 120)
 * @param beatsPerBar - Beats per bar (default 4)
 * @returns The looped window, rebased so the section starts at 0
 */
export function transform(
  notes: PracticeNote[],
  config: SectionLoopConfig,
  bpm: number = 120,
  beatsPerBar: number = 4
): PracticeNote[] {
  const { startMs, endMs } = sectionRange({
    bpm,
    beatsPerBar,
    sectionStartBar: config.startBar,
    sectionEndBar: config.endBar,
  });
  const windowMs = endMs - startMs;

  const head: PracticeNote[] = [];
  const windowed: PracticeNote[] = [];
  for (const note of notes) {
    if (note.onsetMs === undefined) {
      head.push(note);
      continue;
    }
    if (note.onsetMs >= startMs && note.onsetMs < endMs) {
      windowed.push({ ...note, onsetMs: note.onsetMs - startMs });
    }
  }

  const looped: PracticeNote[] = [];
  for (let repeat = 0; repeat < config.repeats; repeat++) {
    const offset = repeat * windowMs;
    for (const note of windowed) {
      looped.push({ ...note, onsetMs: (note.onsetMs ?? 0) + offset });
    }
  }

  return [...head, ...looped];
}
