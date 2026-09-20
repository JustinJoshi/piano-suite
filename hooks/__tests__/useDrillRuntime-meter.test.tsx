import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrillRuntimeProvider } from "@/hooks/useDrillRuntime";

const start = vi.fn();
const cancel = vi.fn();
const finishRound = vi.fn();
const finishNow = vi.fn();
const nextRep = vi.fn();
const arm = vi.fn();

let mockPhase = "idle";
let mockHeldPcs = new Set<number>();

const logPracticeEvent = vi.fn(() => Promise.resolve("eventId"));
const logMissEvent = vi.fn(() => Promise.resolve("missId"));

vi.mock("@/hooks/useDrillTimer", () => ({
  useDrillTimer: vi.fn(() => ({
    phase: mockPhase,
    liveMs: 0,
    countdownValue: 0,
    breakRemaining: 0,
    start,
    arm,
    markSuccess: vi.fn(),
    nextRep,
    finishRound,
    finishNow,
    cancel,
  })),
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

vi.mock("@/lib/analytics", () => ({
  captureEvent: vi.fn(),
}));

describe("useDrillRuntimeProvider transport meter", () => {
  beforeEach(() => {
    mockPhase = "idle";
    mockHeldPcs = new Set();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Five chords against one onset per bar: the 4th and 5th notes wrap to
  // the next cycle, which is where the meter decides the wrap point.
  const meterBlocks = [
    {
      id: "b1",
      type: "chordLibrary",
      config: { chords: "Cmaj7, Dm7, G7, Am7, Em7" },
    },
    {
      id: "b2",
      type: "rhythmPattern",
      config: { leftPattern: "1000000000000000", rightPattern: "", barsPerCycle: 1 },
    },
  ];

  it("threads the transport meter into the composed stream", () => {
    const { result } = renderHook(() =>
      useDrillRuntimeProvider({
        pageId: "page-1",
        clock: { bpm: 60, beatsPerBar: 3 },
        blocks: meterBlocks,
      })
    );

    // 60bpm, meter 3: each subsequent note wraps a three-beat bar later
    // (3000ms steps), not the four-beat 4000ms steps.
    expect(result.current.stream.map((n) => n.onsetMs)).toEqual([
      0, 3000, 6000, 9000, 12000,
    ]);
  });

  it("defaults to a four-beat bar without a transport clock", () => {
    const { result } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1", blocks: meterBlocks })
    );

    // 120bpm default, 4/4: one bar = 2000ms.
    expect(result.current.stream.map((n) => n.onsetMs)).toEqual([
      0, 2000, 4000, 6000, 8000,
    ]);
  });

  it("recomputes the stream when the meter changes", () => {
    const { result, rerender } = renderHook(
      ({ beatsPerBar }) =>
        useDrillRuntimeProvider({
          pageId: "page-1",
          clock: { bpm: 60, beatsPerBar },
          blocks: meterBlocks,
        }),
      { initialProps: { beatsPerBar: 4 } }
    );

    const inFour = result.current.stream.map((n) => n.onsetMs);
    expect(inFour).toEqual([0, 4000, 8000, 12000, 16000]);

    rerender({ beatsPerBar: 3 });

    const inThree = result.current.stream.map((n) => n.onsetMs);
    expect(inThree).toEqual([0, 3000, 6000, 9000, 12000]);
  });
});
