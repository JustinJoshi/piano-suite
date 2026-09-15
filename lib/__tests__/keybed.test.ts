import { describe, expect, it } from "vitest";
import {
  buildKeybedGeometry,
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
