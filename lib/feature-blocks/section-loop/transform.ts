/**
 * Pure section loop transformation.
 * Keeps the notes inside a bar window, rebases the window to start at 0,
 * then repeats it — practise bars N–M instead of the whole piece.
 */

import {
  barWindows,
  type SourceBarWindow,
} from "../../midi-musical-time";
import { sectionRange } from "../transport/clock";
import type { PracticeNote, SourceTiming } from "../../practice-note";
import type { SectionLoopConfig } from "./config";

const MS_PER_MINUTE = 60_000;

/** Beats from the section's first selected bar up to `bar` (bar chosen). */
function beatsIntoSection(windows: SourceBarWindow[], startBar: number, bar: number): number {
  let beats = 0;
  for (let index = startBar; index < bar; index++) {
    beats += windows[index]?.beats ?? 0;
  }
  return beats;
}

/** Total beats spanned by the selected bar window, clamped to the piece. */
function windowBeats(windows: SourceBarWindow[], startBar: number, endBar: number): number {
  let beats = 0;
  for (let bar = startBar; bar < endBar; bar++) {
    const window = windows[bar];
    if (!window) break; // endBar may run past the piece's tail
    beats += window.beats;
  }
  return beats;
}

/**
 * Transform a stream of practice notes by looping the bar window
 * [startBar, endBar) `repeats` times. Notes whose onset falls outside the
 * window are dropped; notes with no onset pass through untouched at the
 * front, in order.
 *
 * For streams carrying source musical metadata (parsed MIDI), the window is
 * selected in *source* bars via the meter map and then retimed to the
 * practice BPM — changing practice speed never changes which musical bars
 * play. Legacy time-only streams use the practice-BPM window as before.
 * @param notes - Input notes from a source or previous transform
 * @param config - Section loop config
 * @param bpm - Tempo (default 120)
 * @param beatsPerBar - Beats per bar (legacy streams only; default 4)
 * @returns The looped window, rebased so the section starts at 0
 */
export function transform(
  notes: PracticeNote[],
  config: SectionLoopConfig,
  bpm: number = 120,
  beatsPerBar: number = 4
): PracticeNote[] {
  const timing = notes.find((note) => note.source !== undefined)?.source?.timing;
  if (timing) return transformSourceTiming(notes, config, bpm, timing);
  return transformLegacy(notes, config, bpm, beatsPerBar);
}

/** Source-bar path: select in ticks/meter, then retime to practice BPM. */
function transformSourceTiming(
  notes: PracticeNote[],
  config: SectionLoopConfig,
  bpm: number,
  timing: SourceTiming
): PracticeNote[] {
  const windows = barWindows(timing);
  const practiceBeatMs = MS_PER_MINUTE / bpm;
  const windowMs = windowBeats(windows, config.startBar, config.endBar) * practiceBeatMs;

  // Clamp the requested span: an endBar past the piece selects fewer bars.
  const last = windows.length - 1;
  if (config.startBar > last) {
    // Empty section: only onset-less head notes survive, silently.
    const head: PracticeNote[] = [];
    for (const note of notes) {
      if (note.source === undefined && note.onsetMs === undefined) head.push(note);
    }
    return head;
  }

  const windowed = notes
    .flatMap((note) => {
      const source = note.source;
      if (
        source === undefined ||
        source.bar < config.startBar ||
        source.bar >= config.endBar
      ) return [];
      const barWindow = windows[source.bar];
      if (!barWindow) return [];
      const beats =
        beatsIntoSection(windows, config.startBar, source.bar) + source.beat;
      const durationBeats = source.durationTicks / source.timing.ppq /
        (4 / barWindow.denominator);
      return [{
        note,
        onsetMs: beats * practiceBeatMs,
        durationMs: durationBeats * practiceBeatMs,
      }];
    });

  const looped: PracticeNote[] = [];
  for (let repeat = 0; repeat < config.repeats; repeat++) {
    const offset = repeat * windowMs;
    for (const { note, onsetMs, durationMs } of windowed) {
      // Source coordinates stay untouched so a downstream sectionLoop can
      // still select in original bars.
      looped.push({ ...note, onsetMs: onsetMs + offset, durationMs });
    }
  }

  return looped;
}

/** Legacy time-only path, preserved exactly from before source metadata. */
function transformLegacy(
  notes: PracticeNote[],
  config: SectionLoopConfig,
  bpm: number,
  beatsPerBar: number
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
