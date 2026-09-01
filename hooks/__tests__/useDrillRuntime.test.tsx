import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrillRuntimeProvider } from "@/hooks/useDrillRuntime";
import { appendLocalWorkshopEvent } from "@/lib/local-practice-history";

const start = vi.fn();
const cancel = vi.fn();
const finishRound = vi.fn();
const nextRep = vi.fn();

let mockPhase = "idle";
let mockHeldPcs = new Set<number>();
let onSuccessCallback: ((elapsedMs: number) => void) | null = null;
let timerOptions: Record<string, unknown> = {};

const logPracticeEvent = vi.fn(() => Promise.resolve("eventId"));
const logMissEvent = vi.fn(() => Promise.resolve("missId"));

vi.mock("@/hooks/useDrillTimer", () => ({
  useDrillTimer: vi.fn((options: { onSuccess?: (elapsedMs: number) => void }) => {
    timerOptions = options;
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

const captureEvent = vi.fn();

vi.mock("@/lib/analytics", () => ({
  captureEvent: (...args: unknown[]) => captureEvent(...args),
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

  it("emits drill_started when the drill starts", () => {
    const { result } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1" })
    );

    act(() => {
      result.current.start();
    });

    expect(captureEvent).toHaveBeenCalledWith("drill_started", {
      pageId: "page-1",
    });
  });

  it("emits drill_completed once on transition into finished", () => {
    mockPhase = "timing";
    const { result, rerender } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1" })
    );

    act(() => {
      result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    mockPhase = "finished";
    rerender();

    expect(captureEvent).toHaveBeenCalledWith("drill_completed", {
      pageId: "page-1",
    });
    expect(captureEvent).toHaveBeenCalledTimes(1);
  });

  it("emits drill_completed again on each new finished run", () => {
    mockPhase = "finished";
    const { result, rerender } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1" })
    );

    expect(captureEvent).toHaveBeenCalledTimes(1);

    act(() => {
      mockPhase = "idle";
      result.current.reset();
    });
    rerender();
    expect(captureEvent).toHaveBeenCalledTimes(1);

    act(() => {
      mockPhase = "finished";
    });
    rerender();
    expect(captureEvent).toHaveBeenCalledTimes(2);
  });

  it("threads block config into the timer", () => {
    renderHook(() =>
      useDrillRuntimeProvider({
        pageId: "page-1",
        countdownSeconds: 7,
        breakSeconds: 9,
        multiRep: false,
      })
    );

    expect(timerOptions).toMatchObject({
      countdownSeconds: 7,
      breakSeconds: 9,
      multiRep: false,
    });
  });

  it("extra notes pass when requireExact is off and fail when on", async () => {
    // Earlier tests override this mock to canPersist: false; pin the
    // Convex path for both sub-cases.
    const { useAuthAccess } = await import("@/hooks/useAuthAccess");
    (useAuthAccess as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      canPersist: true,
    });

    mockPhase = "timing";
    // Cmaj7 (0,4,7,11) held plus an extra note (pc 2) — a superset.
    const superset = new Set([0, 4, 7, 11, 2]);

    const { result, rerender } = renderHook(({ requireExact }) =>
      useDrillRuntimeProvider({ pageId: "page-1", requireExact })
    , { initialProps: { requireExact: false } });

    act(() => {
      result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    mockHeldPcs = superset;
    rerender({ requireExact: false });
    // Superset with requireExact=false: scored as a success.
    expect(logPracticeEvent).toHaveBeenCalledWith(
      expect.objectContaining({ chord: "Cmaj7", grade: "Good" })
    );

    vi.clearAllMocks();
    mockHeldPcs = new Set();

    const second = renderHook(
      ({ requireExact }) => useDrillRuntimeProvider({ pageId: "page-1", requireExact }),
      { initialProps: { requireExact: true } }
    );

    act(() => {
      second.result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    mockHeldPcs = superset;
    second.rerender({ requireExact: true });
    // Same superset with requireExact=true: a miss, not a success.
    expect(logMissEvent).toHaveBeenCalledWith(
      expect.objectContaining({ chord: "Cmaj7", played: "0,2,4,7,11" })
    );
    expect(logPracticeEvent).not.toHaveBeenCalled();
  });

  it("grades by miss count using the configured thresholds", async () => {
    const { useAuthAccess } = await import("@/hooks/useAuthAccess");
    (useAuthAccess as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      canPersist: true,
    });

    mockPhase = "timing";
    // First render: wrong notes → one miss on the target.
    mockHeldPcs = new Set([1, 5, 8]);

    const { result, rerender } = renderHook(() =>
      useDrillRuntimeProvider({
        pageId: "page-1",
        goodThreshold: 1,
        hardThreshold: 3,
      })
    );

    act(() => {
      result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    expect(logMissEvent).toHaveBeenCalledTimes(1);

    // Then the correct chord lands: graded on the accumulated misses (1),
    // which is within goodThreshold 1 → Good.
    mockHeldPcs = new Set([0, 4, 7, 11]);
    rerender();

    expect(logPracticeEvent).toHaveBeenCalledWith(
      expect.objectContaining({ chord: "Cmaj7", grade: "Good" })
    );
  });

  it("a miss beyond the good threshold grades Hard by default", () => {
    mockPhase = "timing";
    mockHeldPcs = new Set([1, 5, 8]);

    const { result, rerender } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1" })
    );

    act(() => {
      result.current.setTargets([
        { id: "Cmaj7", symbol: "Cmaj7", notes: ["C", "E", "G", "B"], pcs: new Set([0, 4, 7, 11]) },
      ]);
    });

    mockHeldPcs = new Set([0, 4, 7, 11]);
    rerender();

    // Default thresholds {good: 0, hard: 2}: one miss → Hard.
    expect(logPracticeEvent).toHaveBeenCalledWith(
      expect.objectContaining({ grade: "Hard" })
    );
  });
});
