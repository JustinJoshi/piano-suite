import { describe, expect, it } from "vitest";
import {
  buildKeybedGeometry,
  buildStripOctave,
  KEYBED_HEIGHT,
  WHITE_KEY_WIDTH,
} from "@/lib/keybed";

describe("buildKeybedGeometry", () => {
  it("draws 7 white and 5 black keys per octave", () => {
    const one = buildKeybedGeometry(1);
    expect(one.whiteKeys).toHaveLength(7);
    expect(one.blackKeys).toHaveLength(5);

    const three = buildKeybedGeometry(3);
    expect(three.whiteKeys).toHaveLength(21);
    expect(three.blackKeys).toHaveLength(15);
    expect(three.width).toBe(21 * WHITE_KEY_WIDTH);
    expect(three.height).toBe(KEYBED_HEIGHT);
  });

  it("assigns chromatic semitones so a C major triad lights C, E, G", () => {
    const { whiteKeys, blackKeys } = buildKeybedGeometry(1);
    expect(whiteKeys.map((k) => k.semitone)).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(blackKeys.map((k) => k.semitone)).toEqual([1, 3, 6, 8, 10]);
  });

  it("places black keys straddling the boundary between white keys", () => {
    const { whiteKeys, blackKeys } = buildKeybedGeometry(1);
    const cSharp = blackKeys[0];
    const c = whiteKeys[0];
    const d = whiteKeys[1];
    expect(cSharp.x).toBeGreaterThan(c.x);
    expect(cSharp.x + cSharp.width).toBeLessThan(d.x + d.width);
    // No black key between E and F.
    expect(blackKeys.some((k) => k.semitone === 5)).toBe(false);
  });

  it("never returns fewer than one octave", () => {
    expect(buildKeybedGeometry(0).whiteKeys).toHaveLength(7);
    expect(buildKeybedGeometry(-2).whiteKeys).toHaveLength(7);
  });
});

describe("buildKeybedGeometry closingC", () => {
  it("adds one white C at the top and no black key", () => {
    const plain = buildKeybedGeometry(2);
    const closed = buildKeybedGeometry(2, { closingC: true });
    expect(closed.whiteKeys).toHaveLength(plain.whiteKeys.length + 1);
    expect(closed.blackKeys).toHaveLength(plain.blackKeys.length);
    const top = closed.whiteKeys[closed.whiteKeys.length - 1];
    expect(top.semitone).toBe(24);
    expect(top.x).toBe(14 * WHITE_KEY_WIDTH);
    expect(closed.width).toBe(15 * WHITE_KEY_WIDTH);
  });
});

describe("buildStripOctave", () => {
  it("tiles one octave of seven white keys", () => {
    const octave = buildStripOctave(20);
    expect(octave.tileWidth).toBe(140);
    expect(octave.blackKeyX).toHaveLength(5);
  });

  it("centres each black key on a white-key boundary", () => {
    const octave = buildStripOctave(20);
    const centres = octave.blackKeyX.map((x) => x + octave.blackKeyWidth / 2);
    // C#, D#, then the E–F gap, then F#, G#, A#.
    expect(centres).toEqual([20, 40, 80, 100, 120]);
  });

  it("clamps absurdly small keys to a drawable width", () => {
    expect(buildStripOctave(0).tileWidth).toBe(28);
  });
});
