import { describe, it, expect } from "vitest";
import {
  buildScaleTargets,
  buildRootCycleTargets,
  buildProgressionTargets,
} from "@/lib/drill-targets";
import { scaleRunnerDefaultConfig } from "@/lib/feature-blocks/scale-runner/config";
import { rootCycleDefaultConfig } from "@/lib/feature-blocks/root-cycle/config";
import { progressionDefaultConfig } from "@/lib/feature-blocks/progression/config";

/** Deterministic stand-in for Math.random so "random" orders are testable. */
function fixedRandom(): number {
  return 0;
}

describe("buildScaleTargets", () => {
  it("emits one single-note target per step", () => {
    const targets = buildScaleTargets({
      ...scaleRunnerDefaultConfig,
      direction: "up",
    });

    expect(targets).toHaveLength(8);
    for (const target of targets) {
      expect(target.pcs.size).toBe(1);
    }
    expect(targets.map((t) => t.symbol)).toEqual([
      "C",
      "D",
      "E",
      "F",
      "G",
      "A",
      "B",
      "C",
    ]);
  });

  it("wraps the pitch class across the octave boundary", () => {
    const targets = buildScaleTargets({
      ...scaleRunnerDefaultConfig,
      direction: "up",
    });
    // The closing tonic is 12 semitones up but the same pitch class.
    expect([...targets[0].pcs]).toEqual([0]);
    expect([...targets[7].pcs]).toEqual([0]);
  });

  it("gives every target a unique id even when notes repeat", () => {
    const targets = buildScaleTargets({
      ...scaleRunnerDefaultConfig,
      direction: "upDown",
    });
    const ids = targets.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("shows the scale degree alongside the note name", () => {
    const targets = buildScaleTargets({
      ...scaleRunnerDefaultConfig,
      direction: "up",
    });
    expect(targets[1].notes).toEqual(["D (2)"]);
  });

  it("returns nothing for an unknown scale", () => {
    expect(
      buildScaleTargets({ ...scaleRunnerDefaultConfig, scaleId: "nope" })
    ).toEqual([]);
  });
});

describe("buildRootCycleTargets", () => {
  it("walks the circle of fourths from the chosen start", () => {
    const targets = buildRootCycleTargets({
      ...rootCycleDefaultConfig,
      qualityId: "maj7",
      startRoot: "C",
      order: "fourths",
    });

    expect(targets).toHaveLength(12);
    expect(targets.slice(0, 4).map((t) => t.symbol)).toEqual([
      "Cmaj7",
      "Fmaj7",
      "Bbmaj7",
      "Ebmaj7",
    ]);
  });

  it("walks the circle of fifths in the other direction", () => {
    const targets = buildRootCycleTargets({
      ...rootCycleDefaultConfig,
      order: "fifths",
    });
    expect(targets.slice(0, 3).map((t) => t.symbol)).toEqual([
      "Cmaj7",
      "Gmaj7",
      "Dmaj7",
    ]);
  });

  it("honours keyCount", () => {
    const targets = buildRootCycleTargets({
      ...rootCycleDefaultConfig,
      keyCount: 4,
    });
    expect(targets).toHaveLength(4);
  });

  it("builds the right pitch classes for a triad", () => {
    const [first] = buildRootCycleTargets({
      ...rootCycleDefaultConfig,
      qualityId: "maj",
      startRoot: "C",
      keyCount: 1,
    });
    expect(first.symbol).toBe("C");
    expect([...first.pcs].sort((a, b) => a - b)).toEqual([0, 4, 7]);
  });

  it("still starts on the chosen key in random order", () => {
    const targets = buildRootCycleTargets(
      { ...rootCycleDefaultConfig, startRoot: "Eb", order: "random" },
      fixedRandom
    );
    expect(targets[0].symbol).toBe("Ebmaj7");
    expect(new Set(targets.map((t) => t.symbol)).size).toBe(12);
  });

  it("falls back to the first quality for an unknown id", () => {
    const [first] = buildRootCycleTargets({
      ...rootCycleDefaultConfig,
      qualityId: "not-a-quality",
      keyCount: 1,
    });
    expect(first.symbol).toBe("C");
  });
});

describe("buildProgressionTargets", () => {
  it("resolves ii-V-I in the chosen key", () => {
    const { targets } = buildProgressionTargets({
      ...progressionDefaultConfig,
      source: "ii-V-I",
      keyRoot: "C",
    });
    expect(targets.map((t) => t.symbol)).toEqual(["Dm7", "G7", "Cmaj7"]);
  });

  it("transposes ii-V-I to another key", () => {
    const { targets } = buildProgressionTargets({
      ...progressionDefaultConfig,
      source: "ii-V-I",
      keyRoot: "F",
    });
    expect(targets.map((t) => t.symbol)).toEqual(["Gm7", "C7", "Fmaj7"]);
  });

  it("builds the pop loop as triads", () => {
    const { targets } = buildProgressionTargets({
      ...progressionDefaultConfig,
      source: "pop",
      keyRoot: "C",
    });
    expect(targets.map((t) => t.symbol)).toEqual(["C", "G", "Am", "F"]);
  });

  it("gives a 12-bar blues twelve chords", () => {
    const { targets } = buildProgressionTargets({
      ...progressionDefaultConfig,
      source: "blues12",
      keyRoot: "C",
    });
    expect(targets).toHaveLength(12);
    expect(targets[0].symbol).toBe("C7");
    expect(targets[4].symbol).toBe("F7");
    expect(targets[8].symbol).toBe("G7");
  });

  it("repeats the progression through a key cycle", () => {
    const { targets } = buildProgressionTargets({
      ...progressionDefaultConfig,
      source: "ii-V-I",
      keyRoot: "C",
      cycleKeys: true,
      cycleOrder: "fourths",
      keyCount: 3,
    });
    expect(targets).toHaveLength(9);
    expect(targets.map((t) => t.symbol)).toEqual([
      "Dm7",
      "G7",
      "Cmaj7",
      "Gm7",
      "C7",
      "Fmaj7",
      "Cm7",
      "F7",
      "Bbmaj7",
    ]);
  });

  it("uses custom roman numerals and reports bad tokens", () => {
    const { targets, invalidTokens } = buildProgressionTargets({
      ...progressionDefaultConfig,
      source: "custom",
      customText: "I bVII IV zzz",
      keyRoot: "C",
    });
    expect(targets.map((t) => t.symbol)).toEqual(["C", "Bb", "F"]);
    expect(invalidTokens).toEqual(["zzz"]);
  });

  it("returns no targets when nothing parses", () => {
    const { targets, invalidTokens } = buildProgressionTargets({
      ...progressionDefaultConfig,
      source: "custom",
      customText: "zzz qqq",
    });
    expect(targets).toEqual([]);
    expect(invalidTokens).toEqual(["zzz", "qqq"]);
  });

  it("gives every target a unique id across repeated keys", () => {
    const { targets } = buildProgressionTargets({
      ...progressionDefaultConfig,
      source: "ii-V-I",
      cycleKeys: true,
      keyCount: 12,
    });
    const ids = targets.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
