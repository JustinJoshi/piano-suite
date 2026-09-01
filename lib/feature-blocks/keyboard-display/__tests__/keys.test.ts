import { describe, it, expect } from "vitest";
import {
  buildKeyboardLayout,
  computerKeyForOffset,
  isBlackNote,
  noteName,
} from "@/lib/feature-blocks/keyboard-display/keys";

describe("buildKeyboardLayout", () => {
  it("splits one octave C3–B3 into 7 white and 5 black keys", () => {
    const layout = buildKeyboardLayout(48, 12);

    expect(layout.whiteKeys.map((k) => k.note)).toEqual([48, 50, 52, 53, 55, 57, 59]);
    expect(layout.blackKeys.map((k) => k.note)).toEqual([49, 51, 54, 56, 58]);
  });

  it("places C#3 on the C|D boundary (1/7 of the width)", () => {
    const layout = buildKeyboardLayout(48, 12);

    const cSharp = layout.blackKeys[0];
    expect(cSharp?.leftFraction).toBeCloseTo(1 / 7);
  });

  it("places F#3 on the F|G boundary (4/7 of the width)", () => {
    const layout = buildKeyboardLayout(48, 12);

    const fSharp = layout.blackKeys.find((k) => k.note === 54);
    expect(fSharp?.leftFraction).toBeCloseTo(4 / 7);
  });

  it("keeps boundaries stable across a two-octave range", () => {
    const one = buildKeyboardLayout(48, 12);
    const two = buildKeyboardLayout(48, 24);

    // Same absolute position in the first octave even though the unit shrinks.
    expect(two.blackKeys[0]?.leftFraction).toBeCloseTo(1 / 14);
    expect(one.blackKeys[0]?.leftFraction).toBeCloseTo(1 / 7);
    expect(two.whiteKeys).toHaveLength(14);
    expect(two.blackKeys).toHaveLength(10);
  });

  it("labels notes and assigns home-row computer keys from the lowest C", () => {
    const layout = buildKeyboardLayout(48, 12);

    expect(layout.whiteKeys[0]).toMatchObject({ name: "C", keyCap: "a" });
    expect(layout.blackKeys[0]).toMatchObject({ name: "C#", keyCap: "w" });
    expect(layout.whiteKeys[2]).toMatchObject({ name: "E", keyCap: "d" });
    // E–F has no black key between: F maps to f, skipping t? No —
    // chromatic offsets: E(4)=d, F(5)=f (t belongs to F#).
    expect(layout.whiteKeys[3]).toMatchObject({ name: "F", keyCap: "f" });
    expect(layout.blackKeys[2]).toMatchObject({ name: "F#", keyCap: "t" });
  });

  it("runs out of computer keys beyond the mapped range", () => {
    const layout = buildKeyboardLayout(48, 36); // 3 octaves

    const lastC = layout.whiteKeys[layout.whiteKeys.length - 1];
    expect(computerKeyForOffset(17)).toBe("'");
    expect(computerKeyForOffset(18)).toBeNull();
    expect(lastC?.keyCap).toBeNull();
  });
});

describe("note helpers", () => {
  it("isBlackNote matches the black-key pitch classes", () => {
    expect(isBlackNote(49)).toBe(true); // C#3
    expect(isBlackNote(51)).toBe(true); // D#3
    expect(isBlackNote(54)).toBe(true); // F#3
    expect(isBlackNote(48)).toBe(false); // C3
    expect(isBlackNote(52)).toBe(false); // E3
    expect(isBlackNote(59)).toBe(false); // B3
  });

  it("noteName wraps below MIDI 0", () => {
    expect(noteName(60)).toBe("C");
    expect(noteName(-1)).toBe("B");
  });
});
