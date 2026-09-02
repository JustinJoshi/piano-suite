import { describe, it, expect } from "vitest";
import {
  buildKeyCyclePcs,
  buildKeyCycleRoots,
  isKeyCycleOrder,
  rootByName,
  KEY_CYCLE_ORDERS,
  KEY_CYCLE_ORDER_LABELS,
} from "@/lib/key-cycles";

describe("buildKeyCyclePcs", () => {
  it("steps down a fifth (up a fourth) for the cycle of fourths", () => {
    expect(buildKeyCyclePcs("fourths", 0)).toEqual([
      0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7,
    ]);
  });

  it("steps up a fifth for the cycle of fifths", () => {
    expect(buildKeyCyclePcs("fifths", 0).slice(0, 4)).toEqual([0, 7, 2, 9]);
  });

  it("walks semitones for chromatic", () => {
    expect(buildKeyCyclePcs("chromatic", 0)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it("covers all twelve keys exactly once for every deterministic order", () => {
    for (const order of ["fourths", "fifths", "chromatic"] as const) {
      const pcs = buildKeyCyclePcs(order, 3);
      expect(new Set(pcs).size).toBe(12);
    }
  });

  it("starts on the chosen key", () => {
    expect(buildKeyCyclePcs("fourths", 3)[0]).toBe(3);
    expect(buildKeyCyclePcs("random", 3, () => 0)[0]).toBe(3);
  });

  it("shuffles the remaining keys for random without dropping any", () => {
    const pcs = buildKeyCyclePcs("random", 0, () => 0.5);
    expect(pcs).toHaveLength(12);
    expect(new Set(pcs).size).toBe(12);
  });

  it("normalizes an out-of-range start", () => {
    expect(buildKeyCyclePcs("chromatic", 14)[0]).toBe(2);
  });
});

describe("buildKeyCycleRoots", () => {
  it("spells the cycle with the project's canonical root names", () => {
    expect(buildKeyCycleRoots("fourths", 0).slice(0, 4).map((r) => r.name)).toEqual(
      ["C", "F", "Bb", "Eb"]
    );
  });
});

describe("isKeyCycleOrder", () => {
  it("accepts every registered order and nothing else", () => {
    for (const order of KEY_CYCLE_ORDERS) {
      expect(isKeyCycleOrder(order)).toBe(true);
      expect(KEY_CYCLE_ORDER_LABELS[order]).toBeTruthy();
    }
    expect(isKeyCycleOrder("thirds")).toBe(false);
    expect(isKeyCycleOrder(undefined)).toBe(false);
  });
});

describe("rootByName", () => {
  it("falls back to C for an unknown name", () => {
    expect(rootByName("Bb").pc).toBe(10);
    expect(rootByName("H").name).toBe("C");
  });
});
