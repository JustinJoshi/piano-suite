import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChordTargets } from "@/hooks/useChordTargets";

describe("useChordTargets", () => {
  it("expands roots and quality groups into targets", () => {
    const { result } = renderHook(() =>
      useChordTargets({
        roots: ["C"],
        qualityGroups: ["7th"],
        order: "sequential",
      })
    );

    expect(result.current.total).toBe(5); // 5 qualities in 7th group
    expect(result.current.current?.symbol).toBe("Cmaj7");
    expect(result.current.current?.notes).toEqual(["C", "E", "G", "B"]);
  });

  it("advances to the next target", () => {
    const { result } = renderHook(() =>
      useChordTargets({
        roots: ["C"],
        qualityGroups: ["7th"],
        order: "sequential",
      })
    );

    expect(result.current.index).toBe(0);

    act(() => result.current.advance());

    expect(result.current.index).toBe(1);
    expect(result.current.current?.symbol).toBe("C7");
  });

  it("does not advance past the last target", () => {
    const { result } = renderHook(() =>
      useChordTargets({
        roots: ["C"],
        qualityGroups: ["7th"],
        order: "sequential",
      })
    );

    for (let i = 0; i < result.current.total + 2; i++) {
      act(() => result.current.advance());
    }

    expect(result.current.index).toBe(result.current.total - 1);
  });

  it("resets to the first target", () => {
    const { result } = renderHook(() =>
      useChordTargets({
        roots: ["C"],
        qualityGroups: ["7th"],
        order: "sequential",
      })
    );

    act(() => result.current.advance());
    act(() => result.current.advance());
    act(() => result.current.reset());

    expect(result.current.index).toBe(0);
  });

  it("respects random order", () => {
    // Deterministic check: random order should still contain all targets.
    const { result } = renderHook(() =>
      useChordTargets({
        roots: ["C"],
        qualityGroups: ["7th"],
        order: "random",
      })
    );

    expect(result.current.total).toBe(5);
    const symbols = result.current.targets.map((t) => t.symbol);
    expect(symbols).toContain("Cmaj7");
    expect(symbols).toContain("C7");
    expect(symbols).toContain("Cm7");
    expect(symbols).toContain("Cm7b5");
    expect(symbols).toContain("Cdim7");
  });
});
