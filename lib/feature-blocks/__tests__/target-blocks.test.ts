import { describe, it, expect } from "vitest";
import {
  TARGET_BLOCK_TYPES,
  isTargetBlockType,
  resolveTargetScoring,
  activeTargetBlock,
  isSupersededTargetBlock,
  DEFAULT_TARGET_SCORING,
} from "@/lib/feature-blocks/target-blocks";
import { featureRegistry, isAtBlockLimit } from "@/lib/feature-blocks/registry";
import { runtimeOptionsFromBlocks } from "@/lib/drill-runtime";

function block(type: string, config: Record<string, unknown> = {}) {
  return { type, config };
}

describe("target block registry agreement", () => {
  it("marks exactly the blocks that provide targets", () => {
    const declared = Object.values(featureRegistry)
      .filter((def) => "provides" in def && def.provides === "targets")
      .map((def) => def.type)
      .sort();

    expect(declared).toEqual([...TARGET_BLOCK_TYPES].sort());
  });

  it("limits every target block to one per page", () => {
    for (const type of TARGET_BLOCK_TYPES) {
      expect(isAtBlockLimit([block(type)], type)).toBe(true);
    }
  });

  it("leaves unconstrained blocks unlimited", () => {
    expect(isAtBlockLimit([block("textBlock"), block("textBlock")], "textBlock")).toBe(
      false
    );
  });
});

describe("isTargetBlockType", () => {
  it("recognises target blocks and nothing else", () => {
    expect(isTargetBlockType("chordSet")).toBe(true);
    expect(isTargetBlockType("scaleRunner")).toBe(true);
    expect(isTargetBlockType("metronome")).toBe(false);
  });
});

describe("activeTargetBlock", () => {
  it("picks the first target block in page order", () => {
    const blocks = [
      block("metronome"),
      block("scaleRunner"),
      block("chordSet"),
    ];
    expect(activeTargetBlock(blocks)).toBe(blocks[1]);
  });

  it("returns null when the page has no target block", () => {
    expect(activeTargetBlock([block("metronome"), block("textBlock")])).toBeNull();
  });
});

describe("isSupersededTargetBlock", () => {
  it("flags every target block after the first", () => {
    const blocks = [block("chordSet"), block("scaleRunner")];
    expect(isSupersededTargetBlock(blocks, blocks[0])).toBe(false);
    expect(isSupersededTargetBlock(blocks, blocks[1])).toBe(true);
  });

  it("never flags a non-target block", () => {
    const blocks = [block("chordSet"), block("metronome")];
    expect(isSupersededTargetBlock(blocks, blocks[1])).toBe(false);
  });
});

describe("resolveTargetScoring", () => {
  it("returns null for a block that provides no targets", () => {
    expect(resolveTargetScoring("metronome", {})).toBeNull();
  });

  it("reads each target block's own scoring defaults", () => {
    // A scale step is a single note, so subset matching is wrong for it.
    expect(resolveTargetScoring("scaleRunner", {})?.requireExact).toBe(true);
    expect(resolveTargetScoring("chordSet", {})?.requireExact).toBe(false);
  });

  it("honours stored overrides", () => {
    expect(
      resolveTargetScoring("chordSet", {
        requireExact: true,
        goodThreshold: 1,
        hardThreshold: 5,
      })
    ).toEqual({ requireExact: true, goodThreshold: 1, hardThreshold: 5 });
  });
});

describe("runtimeOptionsFromBlocks", () => {
  it("falls back to the shared defaults with no blocks", () => {
    const options = runtimeOptionsFromBlocks([]);
    expect(options.requireExact).toBe(DEFAULT_TARGET_SCORING.requireExact);
    expect(options.goodThreshold).toBe(DEFAULT_TARGET_SCORING.goodThreshold);
    expect(options.hardThreshold).toBe(DEFAULT_TARGET_SCORING.hardThreshold);
    // No timer block means every target runs in one round.
    expect(options.multiRep).toBe(true);
  });

  it("takes scoring from a non-chordSet target block", () => {
    const options = runtimeOptionsFromBlocks([
      block("scaleRunner", { goodThreshold: 2, hardThreshold: 6 }),
    ]);
    expect(options.requireExact).toBe(true);
    expect(options.goodThreshold).toBe(2);
    expect(options.hardThreshold).toBe(6);
  });

  it("lets the first target block win when a page has two", () => {
    const options = runtimeOptionsFromBlocks([
      block("chordSet", { requireExact: false }),
      block("scaleRunner", { requireExact: true }),
    ]);
    expect(options.requireExact).toBe(false);
  });

  it("still reads round shape from the drill timer", () => {
    const options = runtimeOptionsFromBlocks([
      block("drillTimer", {
        countdownSeconds: 7,
        breakSeconds: 11,
        multiRep: true,
      }),
      block("rootCycle"),
    ]);
    expect(options.countdownSeconds).toBe(7);
    expect(options.breakSeconds).toBe(11);
    expect(options.multiRep).toBe(true);
  });
});
