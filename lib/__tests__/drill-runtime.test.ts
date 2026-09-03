import { describe, it, expect } from "vitest";
import { runtimeOptionsFromBlocks } from "@/lib/drill-runtime";

describe("runtimeOptionsFromBlocks", () => {
  it("returns legacy defaults when the page has no timer or chord blocks", () => {
    expect(runtimeOptionsFromBlocks([])).toEqual({
      countdownSeconds: 3,
      breakSeconds: 5,
      // No drillTimer block: keep the multi-targets-per-round behavior.
      multiRep: true,
      requireExact: false,
      goodThreshold: 0,
      hardThreshold: 2,
      // No transport block: the page stays event-advanced.
      clock: null,
    });
  });

  it("threads transport config into the clock", () => {
    const options = runtimeOptionsFromBlocks([
      { type: "transport", config: { bpm: 90, beatsPerBar: 3 } },
    ]);

    expect(options.clock).toEqual({ bpm: 90, beatsPerBar: 3 });
  });

  it("threads drillTimer config into round shape", () => {
    const options = runtimeOptionsFromBlocks([
      {
        type: "drillTimer",
        config: { countdownSeconds: 7, breakSeconds: 9, multiRep: false },
      },
    ]);

    expect(options).toMatchObject({
      countdownSeconds: 7,
      breakSeconds: 9,
      multiRep: false,
    });
  });

  it("threads chordSet config into scoring", () => {
    const options = runtimeOptionsFromBlocks([
      {
        type: "chordSet",
        config: {
          roots: ["C"],
          qualityGroups: ["7th"],
          order: "random",
          requireExact: true,
          goodThreshold: 1,
          hardThreshold: 3,
        },
      },
    ]);

    expect(options).toMatchObject({
      requireExact: true,
      goodThreshold: 1,
      hardThreshold: 3,
    });
  });

  it("uses the first drillTimer and first chordSet block", () => {
    const options = runtimeOptionsFromBlocks([
      {
        type: "drillTimer",
        config: { countdownSeconds: 2, breakSeconds: 4, multiRep: true },
      },
      { type: "drillTimer", config: { countdownSeconds: 20 } },
      { type: "chordSet", config: { requireExact: true, goodThreshold: 5 } },
      { type: "chordSet", config: { requireExact: false } },
    ]);

    expect(options).toMatchObject({
      countdownSeconds: 2,
      breakSeconds: 4,
      requireExact: true,
      goodThreshold: 5,
    });
  });

  it("normalizes untrusted raw configs (clamped / defaulted)", () => {
    const options = runtimeOptionsFromBlocks([
      { type: "drillTimer", config: { countdownSeconds: 999, multiRep: "yes" } },
      { type: "chordSet", config: { goodThreshold: -5, hardThreshold: 1e9 } },
    ]);

    expect(options).toMatchObject({
      // 999 clamps to the drillTimer field max of 30; "yes" is not a
      // recognized truthy string, so multiRep fails closed to the default.
      countdownSeconds: 30,
      multiRep: false,
      goodThreshold: 0,
      hardThreshold: 99,
    });
  });
});
