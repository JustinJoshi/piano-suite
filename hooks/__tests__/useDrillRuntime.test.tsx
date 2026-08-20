import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrillRuntimeProvider } from "@/hooks/useDrillRuntime";

const markSuccess = vi.fn();
const nextRep = vi.fn();
const finishRound = vi.fn();
const start = vi.fn();
const cancel = vi.fn();

let mockPhase = "idle";
let mockHeldPcs = new Set<number>();

vi.mock("@/hooks/useDrillTimer", () => ({
  useDrillTimer: vi.fn(() => ({
    phase: mockPhase,
    liveMs: 0,
    countdownValue: 0,
    breakRemaining: 0,
    start,
    markSuccess,
    nextRep,
    finishRound,
    cancel,
  })),
}));

vi.mock("@/hooks/useMidi", () => ({
  useMidi: vi.fn(() => ({
    heldPcs: mockHeldPcs,
  })),
}));

describe("useDrillRuntimeProvider", () => {
  beforeEach(() => {
    mockPhase = "idle";
    mockHeldPcs = new Set();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("setTargets updates current target and total", () => {
    const { result } = renderHook(() => useDrillRuntimeProvider());

    act(() => {
      result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    expect(result.current.currentTarget?.symbol).toBe("Cmaj7");
    expect(result.current.totalTargets).toBe(1);
  });

  it("start resets state and starts timer", () => {
    const { result } = renderHook(() => useDrillRuntimeProvider());

    act(() => {
      result.current.start();
    });

    expect(start).toHaveBeenCalled();
    expect(result.current.targetIndex).toBe(0);
  });

  it("calls markSuccess when correct notes are held during timing", () => {
    mockPhase = "timing";
    mockHeldPcs = new Set([0, 4, 7, 11]);

    const { result } = renderHook(() => useDrillRuntimeProvider());

    act(() => {
      result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    expect(markSuccess).toHaveBeenCalled();
  });

  it("does not score outside timing phase", () => {
    mockPhase = "idle";
    mockHeldPcs = new Set([0, 4, 7, 11]);

    const { result } = renderHook(() => useDrillRuntimeProvider());

    act(() => {
      result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    expect(markSuccess).not.toHaveBeenCalled();
  });
});
