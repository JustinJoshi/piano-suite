/**
 * Geometry for the decorative piano keybed (`components/brand/keybed.tsx`).
 *
 * Pure math so it can be unit-tested and reused by any SVG/Canvas renderer.
 * All coordinates live in a fixed viewBox: each white key is 10 units wide,
 * the keybed is 40 units tall, and an optional 3-unit felt strip sits above.
 */

export const WHITE_KEY_WIDTH = 10;
export const KEYBED_HEIGHT = 40;
export const FELT_HEIGHT = 3;
const BLACK_KEY_WIDTH = 6;
const BLACK_KEY_HEIGHT = 24;

/** Semitone offsets (within an octave) that are white keys, in order. */
const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11] as const;
/** Black keys sit between white keys at these white-key indices. */
const BLACK_AFTER_WHITE_INDEX: Record<number, number> = {
  0: 1, // C#
  1: 3, // D#
  3: 6, // F#
  4: 8, // G#
  5: 10, // A#
};

export type KeybedKey = {
  /** Semitone offset from the first C of the keybed. */
  semitone: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type KeybedGeometry = {
  width: number;
  height: number;
  feltHeight: number;
  whiteKeys: KeybedKey[];
  blackKeys: KeybedKey[];
};

export function buildKeybedGeometry(octaves: number): KeybedGeometry {
  const count = Math.max(1, Math.floor(octaves));
  const whiteKeys: KeybedKey[] = [];
  const blackKeys: KeybedKey[] = [];

  for (let octave = 0; octave < count; octave += 1) {
    for (let i = 0; i < WHITE_SEMITONES.length; i += 1) {
      const x = (octave * 7 + i) * WHITE_KEY_WIDTH;
      whiteKeys.push({
        semitone: octave * 12 + WHITE_SEMITONES[i],
        x,
        y: FELT_HEIGHT,
        width: WHITE_KEY_WIDTH,
        height: KEYBED_HEIGHT - FELT_HEIGHT,
      });

      const blackSemitone = BLACK_AFTER_WHITE_INDEX[i];
      if (blackSemitone !== undefined) {
        blackKeys.push({
          semitone: octave * 12 + blackSemitone,
          x: x + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
          y: FELT_HEIGHT,
          width: BLACK_KEY_WIDTH,
          height: BLACK_KEY_HEIGHT,
        });
      }
    }
  }

  return {
    width: count * 7 * WHITE_KEY_WIDTH,
    height: KEYBED_HEIGHT,
    feltHeight: FELT_HEIGHT,
    whiteKeys,
    blackKeys,
  };
}
