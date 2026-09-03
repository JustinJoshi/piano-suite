import { describe, it, expect } from "vitest";
import { buildSymbolView, buildKeysDiagramView } from "../render-model";
import type { PracticeNote } from "../../preview-fixtures";

const notes: PracticeNote[] = [
  { midi: [60], pcs: new Set([0]), symbol: "C" },
  { midi: [62], pcs: new Set([2]), symbol: "D" },
  { midi: [64], pcs: new Set([4]), symbol: "E" },
];

describe("buildSymbolView", () => {
  it("shows the current symbol", () => {
    expect(buildSymbolView(notes, 1).current).toBe("D");
  });

  it("previews the next symbol when asked", () => {
    expect(buildSymbolView(notes, 0, { showNext: true }).next).toBe("D");
    expect(buildSymbolView(notes, 0, { showNext: false }).next).toBeUndefined();
  });

  it("omits next on the last target", () => {
    expect(buildSymbolView(notes, 2, { showNext: true }).next).toBeUndefined();
  });

  it("reports position", () => {
    expect(buildSymbolView(notes, 1, { showPosition: true }).position).toBe(
      "2 of 3"
    );
  });

  it("handles an empty stream", () => {
    expect(buildSymbolView([], 0).current).toBe("—");
  });
});

describe("buildKeysDiagramView", () => {
  it("shows the current pitch classes", () => {
    expect(buildKeysDiagramView(notes, 0).current).toEqual(new Set([0]));
  });

  it("previews the next pitch classes", () => {
    expect(buildKeysDiagramView(notes, 0, { showNext: true }).next).toEqual(
      new Set([2])
    );
  });

  it("handles an empty stream", () => {
    expect(buildKeysDiagramView([], 0).current).toEqual(new Set());
  });
});
