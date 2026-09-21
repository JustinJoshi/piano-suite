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

const twoTargets = [
  {
    id: "a",
    symbol: "C",
    notes: ["C"],
    pcs: new Set([0]),
  },
  {
    id: "b",
    symbol: "D",
    notes: ["D"],
    pcs: new Set([2]),
  },
];

const transportBlocks = (bpm: number) => [
  { id: "t1", type: "transport", config: { bpm, beatsPerBar: 4 } },
];

describe("useDrillRuntimeProvider transport tempo override", () => {
  beforeEach(() => {
    mockPhase = "idle";
    mockHeldPcs = new Set();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("a live override re-times the clock window and keeps target progress", () => {
    vi.useFakeTimers();
    mockPhase = "timing";

    const { result } = renderHook(() =>
      useDrillRuntimeProvider({
        pageId: "page-1",
        clock: { bpm: 60, beatsPerBar: 4 },
        blocks: transportBlocks(60),
      })
    );

    act(() => {
      result.current.setTargets(twoTargets);
    });

    // 60bpm 4/4 → 4000ms window; the first bar closes unmet and advances.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.targetIndex).toBe(1);

    // The player turns the tempo up live: 120bpm 4/4 → 2000ms window, and
    // the current target stays where it was.
    act(() => {
      result.current.setTransportBpm(120);
    });
    expect(result.current.targetIndex).toBe(1);

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(result.current.targetIndex).toBe(1);
    expect(finishNow).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    // Last target's window closed at the live tempo: round ends.
    expect(finishNow).toHaveBeenCalled();
  });

  it("the override re-times the composed stream", () => {
    const { result } = renderHook(() =>
      useDrillRuntimeProvider({
        pageId: "page-1",
        clock: { bpm: 60, beatsPerBar: 4 },
        blocks: [
          ...transportBlocks(60),
          { id: "b1", type: "chordLibrary", config: { chords: "Cmaj7, Dm7" } },
          { id: "b2", type: "rhythmPattern", config: {} },
        ],
      })
    );

    expect(result.current.stream[1].onsetMs).toBe(250);

    act(() => {
      result.current.setTransportBpm(120);
    });

    expect(result.current.stream[1].onsetMs).toBe(125);
  });

  it("clamps the override to the transport BPM bounds", () => {
    const withSource = renderHook(() =>
      useDrillRuntimeProvider({
        pageId: "page-1",
        clock: { bpm: 60, beatsPerBar: 4 },
        blocks: [
          ...transportBlocks(60),
          { id: "b1", type: "chordLibrary", config: { chords: "Cmaj7, Dm7" } },
          { id: "b2", type: "rhythmPattern", config: {} },
        ],
      })
    );

    act(() => {
      withSource.result.current.setTransportBpm(9999);
    });
    // 300bpm 4/4 → 500ms per bar, 31.25ms per 16th step... the 16th-step
    // lands at 15000/300 = 50ms.
    expect(withSource.result.current.stream[1].onsetMs).toBe(50);

    act(() => {
      withSource.result.current.setTransportBpm(1);
    });
    // 30bpm 4/4 → 8000ms per bar, 500ms per 16th step.
    expect(withSource.result.current.stream[1].onsetMs).toBe(500);
  });

  it("null restores the saved tempo", () => {
    const { result } = renderHook(() =>
      useDrillRuntimeProvider({
        pageId: "page-1",
        clock: { bpm: 60, beatsPerBar: 4 },
        blocks: [
          ...transportBlocks(60),
          { id: "b1", type: "chordLibrary", config: { chords: "Cmaj7, Dm7" } },
          { id: "b2", type: "rhythmPattern", config: {} },
        ],
      })
    );

    act(() => {
      result.current.setTransportBpm(120);
    });
    expect(result.current.stream[1].onsetMs).toBe(125);

    act(() => {
      result.current.setTransportBpm(null);
    });
    expect(result.current.stream[1].onsetMs).toBe(250);
  });

  it("a saved BPM change clears the override", () => {
    const { result, rerender } = renderHook(
      ({ bpm }) =>
        useDrillRuntimeProvider({
          pageId: "page-1",
          clock: { bpm, beatsPerBar: 4 },
          blocks: [
            ...transportBlocks(bpm),
            { id: "b1", type: "chordLibrary", config: { chords: "Cmaj7, Dm7" } },
            { id: "b2", type: "rhythmPattern", config: {} },
          ],
        }),
      { initialProps: { bpm: 60 } }
    );

    act(() => {
      result.current.setTransportBpm(120);
    });
    expect(result.current.stream[1].onsetMs).toBe(125);

    // The saved config changes to 90bpm — the live override must drop so
    // the page reflects the saved 90, not the stale 120.
    rerender({ bpm: 90 });
    expect(result.current.stream[1].onsetMs).toBeCloseTo(15000 / 90, 6);
  });

  it("removing the transport block clears the override and restores defaults", () => {
    const { result, rerender } = renderHook(
      ({ withTransport }) =>
        useDrillRuntimeProvider({
          pageId: "page-1",
          clock: withTransport ? { bpm: 60, beatsPerBar: 4 } : null,
          blocks: withTransport
            ? [
                ...transportBlocks(60),
                { id: "b1", type: "chordLibrary", config: { chords: "Cmaj7, Dm7" } },
                { id: "b2", type: "rhythmPattern", config: {} },
              ]
            : [
                { id: "b1", type: "chordLibrary", config: { chords: "Cmaj7, Dm7" } },
                { id: "b2", type: "rhythmPattern", config: {} },
              ],
        }),
      { initialProps: { withTransport: true } }
    );

    act(() => {
      result.current.setTransportBpm(120);
    });
    expect(result.current.stream[1].onsetMs).toBe(125);

    rerender({ withTransport: false });
    // No transport: the composer's 120bpm default times the stream.
    expect(result.current.stream[1].onsetMs).toBe(125);
  });

  it("the ramp derives from the override base, not the saved bpm", () => {
    const { result } = renderHook(() =>
      useDrillRuntimeProvider({
        pageId: "page-1",
        clock: { bpm: 60, beatsPerBar: 4 },
        blocks: [
          {
            id: "t1",
            type: "transport",
            config: {
              bpm: 60,
              beatsPerBar: 4,
              rampEnabled: true,
              rampTargetBpm: 180,
              rampOverReps: 1,
            },
          },
          { id: "b1", type: "chordLibrary", config: { chords: "Cmaj7, Dm7" } },
          { id: "b2", type: "rhythmPattern", config: {} },
        ],
      })
    );

    // No override: ramp from 60 toward 180 at rep 0 → 60.
    expect(result.current.stream[1].onsetMs).toBe(250);

    act(() => {
      result.current.setTransportBpm(90);
    });
    // Ramp now starts from the live 90: rep 0 of a 90→180 ramp is 90.
    expect(result.current.stream[1].onsetMs).toBeCloseTo(15000 / 90, 6);

    act(() => {
      result.current.setTargets(twoTargets);
    });
    act(() => {
      result.current.skipTarget();
    });
    // Rep 1 of 1: clamped at the 180 target.
    expect(result.current.stream[1].onsetMs).toBeCloseTo(15000 / 180, 6);
  });

  it("pages without a transport keep event-driven behavior with an override", () => {
    vi.useFakeTimers();
    mockPhase = "timing";

    const { result } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1", clock: null })
    );

    act(() => {
      result.current.setTargets(twoTargets);
    });

    act(() => {
      result.current.setTransportBpm(120);
    });

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    // No transport block: no clock advancement, no misses — even with a
    // (harmless) live override set.
    expect(result.current.targetIndex).toBe(0);
    expect(result.current.misses).toBe(0);
    expect(logMissEvent).not.toHaveBeenCalled();
    expect(finishNow).not.toHaveBeenCalled();
  });

  it("reset keeps the live override as the base tempo", () => {
    vi.useFakeTimers();
    mockPhase = "timing";

    const { result } = renderHook(() =>
      useDrillRuntimeProvider({
        pageId: "page-1",
        clock: { bpm: 60, beatsPerBar: 4 },
        blocks: transportBlocks(60),
      })
    );

    act(() => {
      result.current.setTargets(twoTargets);
    });
    act(() => {
      result.current.setTransportBpm(120);
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.targetIndex).toBe(0);

    mockPhase = "timing";
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(result.current.targetIndex).toBe(0);
    expect(finishNow).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    // Still 2000ms windows at the user's live 120bpm after a reset round.
    expect(result.current.targetIndex).toBe(1);
  });
});
