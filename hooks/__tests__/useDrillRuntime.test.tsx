import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrillRuntimeProvider } from "@/hooks/useDrillRuntime";
import {
  appendLocalWorkshopEvent,
  appendLocalWorkshopMiss,
} from "@/lib/local-practice-history";

const start = vi.fn();
const cancel = vi.fn();
const finishRound = vi.fn();
const nextRep = vi.fn();

let mockPhase = "idle";
let mockHeldPcs = new Set<number>();
let onSuccessCallback: ((elapsedMs: number) => void) | null = null;

const logPracticeEvent = vi.fn(() => Promise.resolve("eventId"));
const logMissEvent = vi.fn(() => Promise.resolve("missId"));

vi.mock("@/hooks/useDrillTimer", () => ({
  useDrillTimer: vi.fn((options: { onSuccess?: (elapsedMs: number) => void }) => {
    onSuccessCallback = options.onSuccess ?? null;
    return {
      phase: mockPhase,
      liveMs: 0,
      countdownValue: 0,
      breakRemaining: 0,
      start,
      markSuccess: vi.fn(() => {
        onSuccessCallback?.(1200);
      }),
      nextRep,
      finishRound,
      cancel,
    };
  }),
}));

vi.mock("@/hooks/useMidi", () => ({
  useMidi: vi.fn(() => ({
    heldPcs: mockHeldPcs,
  })),
}));

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: vi.fn(() => ({
    canPersist: true,
  })),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    tracking: {
      logPracticeEvent: { __mutation: "logPracticeEvent" },
      logMissEvent: { __mutation: "logMissEvent" },
    },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn((mutation: { __mutation?: string }) => {
    if (mutation?.__mutation === "logMissEvent") return logMissEvent;
    return logPracticeEvent;
  }),
}));

vi.mock("@/lib/local-practice-history", () => ({
  appendLocalWorkshopEvent: vi.fn(() => "localId"),
  appendLocalWorkshopMiss: vi.fn(),
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

  it("logs successful targets to Convex when Pro", () => {
    mockPhase = "timing";
    mockHeldPcs = new Set([0, 4, 7, 11]);

    const { result } = renderHook(() => useDrillRuntimeProvider({ pageId: "page-1" }));

    act(() => {
      result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    expect(logPracticeEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: "workshop",
        chord: "Cmaj7",
        reactionTimeMs: 1200,
        grade: "Good",
        redo: false,
        pageId: "page-1",
      })
    );
  });

  it("does not score outside timing phase", () => {
    mockPhase = "idle";
    mockHeldPcs = new Set([0, 4, 7, 11]);

    const { result } = renderHook(() => useDrillRuntimeProvider({ pageId: "page-1" }));

    act(() => {
      result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    expect(logPracticeEvent).not.toHaveBeenCalled();
  });

  it("logs misses to Convex when Pro", () => {
    mockPhase = "timing";
    mockHeldPcs = new Set([1, 5, 8]); // wrong notes

    const { result } = renderHook(() => useDrillRuntimeProvider({ pageId: "page-1" }));

    act(() => {
      result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    expect(logMissEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: "workshop",
        chord: "Cmaj7",
        played: "1,5,8",
        pageId: "page-1",
      })
    );
  });

  it("falls back to localStorage for Free users", async () => {
    const { useAuthAccess } = await import("@/hooks/useAuthAccess");
    (useAuthAccess as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      canPersist: false,
    });

    mockPhase = "timing";
    mockHeldPcs = new Set([0, 4, 7, 11]);

    const { result } = renderHook(() => useDrillRuntimeProvider({ pageId: "page-free" }));

    act(() => {
      result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    expect(appendLocalWorkshopEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        pageId: "page-free",
        target: "Cmaj7",
        reactionTimeMs: 1200,
        misses: 0,
        grade: "Good",
      })
    );
    expect(logPracticeEvent).not.toHaveBeenCalled();
  });
});
