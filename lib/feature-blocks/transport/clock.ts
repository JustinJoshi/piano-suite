/**
 * Pure clock math for the Transport component.
 * No React, no side effects — all functions are deterministic.
 */

/**
 * Convert a beat count to milliseconds at a given BPM.
 * @param beats - Number of beats (can be fractional)
 * @param bpm - Tempo in beats per minute
 * @returns Duration in milliseconds
 */
export function beatsToMs(beats: number, bpm: number): number {
  return (beats / bpm) * 60000;
}

/**
 * Convert milliseconds to beats at a given BPM.
 * @param ms - Duration in milliseconds
 * @param bpm - Tempo in beats per minute
 * @returns Number of beats (can be fractional)
 */
export function msToBeat(ms: number, bpm: number): number {
  return (ms / 60000) * bpm;
}

/**
 * Calculate the millisecond range of a section (inclusive start, exclusive end).
 * Section numbering starts at 0.
 * @param config - Transport config with beatsPerBar and metreStart/End
 * @returns Object with startMs and endMs
 */
export interface SectionRangeConfig {
  bpm: number;
  beatsPerBar: number;
  sectionStartBar: number;
  sectionEndBar: number;
}

export function sectionRange(config: SectionRangeConfig): {
  startMs: number;
  endMs: number;
} {
  const { bpm, beatsPerBar, sectionStartBar, sectionEndBar } = config;
  const startBeats = sectionStartBar * beatsPerBar;
  const endBeats = sectionEndBar * beatsPerBar;
  return {
    startMs: beatsToMs(startBeats, bpm),
    endMs: beatsToMs(endBeats, bpm),
  };
}

/**
 * Interpolate tempo between start and end BPM based on progress.
 * Used for tempo ramps: when progress = 0, result is startBpm; when progress = 1, result is endBpm.
 * @param startBpm - Starting tempo
 * @param endBpm - Ending tempo
 * @param progress - Linear progress from 0 to 1
 * @returns Interpolated BPM
 */
export function rampTempo(startBpm: number, endBpm: number, progress: number): number {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  return startBpm + (endBpm - startBpm) * clampedProgress;
}

/**
 * Calculate the current beat position within a bar.
 * Used to determine visual position and subdivision for rendering.
 * @param beatPosition - Overall beat position in the piece
 * @param beatsPerBar - Number of beats per bar
 * @returns Fractional beat within the current bar (0 to beatsPerBar)
 */
export function beatInBar(beatPosition: number, beatsPerBar: number): number {
  return beatPosition % beatsPerBar;
}

/**
 * Calculate which bar we are in (0-indexed).
 * @param beatPosition - Overall beat position in the piece
 * @param beatsPerBar - Number of beats per bar
 * @returns Bar number (0-indexed)
 */
export function barNumber(beatPosition: number, beatsPerBar: number): number {
  return Math.floor(beatPosition / beatsPerBar);
}
