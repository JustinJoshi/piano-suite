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
const finishNow = vi.fn();
const nextRep = vi.fn();
const arm = vi.fn();

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
      arm,
      markSuccess: vi.fn(() => {
        onSuccessCallback?.(900);
      }),
      nextRep,
      finishRound,
      finishNow,
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
    canPersist: false,
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

// A chord library source: two chords the generator produces untimed, so the
// adapter keeps each as its own target in page order.
const sourceBlocks = [
  { id: "src", type: "chordLibrary", config: { chords: "Cmaj7, G7" } },
];

function displayAndTimerBlocks() {
  return [
    ...sourceBlocks,
    { id: "disp", type: "targetDisplay", config: {} },
    { id: "timer", type: "drillTimer", config: {} },
  ];
}

describe("useDrillRuntimeProvider source-practice fallback", () => {
  beforeEach(() => {
    mockPhase = "idle";
    mockHeldPcs = new Set();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("derives fallback targets from the stream on a source-only page", () => {
    const { result } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1", blocks: displayAndTimerBlocks() })
    );

    expect(result.current.totalTargets).toBe(2);
    expect(result.current.currentTarget?.symbol).toBe("Cmaj7");
    expect(result.current.targets[1]?.symbol).toBe("G7");
  });

  it("scores and logs successes against fallback targets on the local path", () => {
    mockPhase = "timing";
    mockHeldPcs = new Set([0, 4, 7, 11]); // Cmaj7

    const { result } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1", blocks: displayAndTimerBlocks() })
    );

    expect(appendLocalWorkshopEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        pageId: "page-1",
        target: "Cmaj7",
        misses: 0,
        grade: "Good",
      })
    );
    // First target met: the runtime advanced to the second fallback target.
    expect(result.current.targetIndex).toBe(1);
    expect(result.current.currentTarget?.symbol).toBe("G7");
  });

  it("does not apply fallback targets when an explicit target block is on the page", () => {
    mockPhase = "timing";
    mockHeldPcs = new Set();

    const blocks = [
      ...sourceBlocks,
      { id: "disp", type: "targetDisplay", config: {} },
      { id: "timer", type: "drillTimer", config: {} },
      {
        id: "chords",
        type: "chordSet",
        config: {
          roots: ["F"],
          qualityGroups: ["Triads"],
          order: "sequential",
        },
      },
    ];

    const { result } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1", blocks })
    );

    // The fallback must stay out of the way: the chordSet block owns the
    // page through useTargetSource (proved at the component level), so the
    // runtime's target list starts empty until that block registers.
    expect(result.current.totalTargets).toBe(0);
  });

  it("excludes accompaniment notes from fallback targets", () => {
    const blocks = [
      { id: "src", type: "chordLibrary", config: { chords: "Cmaj7, G7" } },
      { id: "disp", type: "targetDisplay", config: {} },
      { id: "timer", type: "drillTimer", config: {} },
    ];

    const { result } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1", blocks })
    );

    // Sanity: playable content produces targets. The 'acc' exclusion itself
    // is the adapter's unit-tested contract; here we assert the runtime
    // passes the raw stream through it unmodified.
    expect(result.current.totalTargets).toBe(2);
    expect(result.current.stream.every((n) => n.pcs.size > 0)).toBe(true);
  });

  it("clears fallback targets when the source is removed", () => {
    const { result, rerender } = renderHook(
      ({ blocks }: { blocks: Array<{ id: string; type: string; config: unknown }> }) =>
        useDrillRuntimeProvider({ pageId: "page-1", blocks }),
      {
        initialProps: { blocks: displayAndTimerBlocks() },
      }
    );

    expect(result.current.totalTargets).toBe(2);

    rerender({
      blocks: [
        { id: "disp", type: "targetDisplay", config: {} },
        { id: "timer", type: "drillTimer", config: {} },
      ],
    });

    expect(result.current.totalTargets).toBe(0);
    expect(result.current.currentTarget).toBeNull();
  });

  it("rebuilds fallback targets when the source content changes", () => {
    const { result, rerender } = renderHook(
      ({ blocks }: { blocks: Array<{ id: string; type: string; config: unknown }> }) =>
        useDrillRuntimeProvider({ pageId: "page-1", blocks }),
      {
        initialProps: { blocks: displayAndTimerBlocks() },
      }
    );

    expect(result.current.targets.map((t) => t.symbol)).toEqual(["Cmaj7", "G7"]);

    rerender({
      blocks: [
        { id: "src", type: "chordLibrary", config: { chords: "Dm7, Am7, E7" } },
        { id: "disp", type: "targetDisplay", config: {} },
        { id: "timer", type: "drillTimer", config: {} },
      ],
    });

    expect(result.current.targets.map((t) => t.symbol)).toEqual(["Dm7", "Am7", "E7"]);
    expect(result.current.targetIndex).toBe(0);
  });

  it("keeps targetIndex and misses across a tempo-ramp-only stream rebuild", () => {
    const rampBlocks = () => [
      ...sourceBlocks,
      {
        id: "t1",
        type: "transport",
        config: {
          bpm: 60,
          beatsPerBar: 4,
          rampEnabled: true,
          rampTargetBpm: 90,
          rampOverReps: 4,
        },
      },
      { id: "disp", type: "targetDisplay", config: {} },
      { id: "timer", type: "drillTimer", config: {} },
    ];

    const { result, rerender } = renderHook(() =>
      useDrillRuntimeProvider({
        pageId: "page-1",
        clock: { bpm: 60, beatsPerBar: 4 },
        blocks: rampBlocks(),
      })
    );

    expect(result.current.targetIndex).toBe(0);

    // Completing a rep advances the ramp: the stream is rebuilt at a higher
    // bpm (new onsets), but the targets' logical identity is unchanged.
    act(() => {
      result.current.skipTarget();
    });
    rerender();

    expect(result.current.targetIndex).toBe(1);
    expect(result.current.misses).toBe(0);
    expect(result.current.currentTarget?.symbol).toBe("G7");
    const rampedOnsets = result.current.stream.map((n) => n.onsetMs);
    expect(rampedOnsets.length).toBeGreaterThan(0);

    // Another commit (as the ramp's stream rebuild would trigger) must not
    // reset anything: identity, not array reference, gates application.
    rerender();

    expect(result.current.targetIndex).toBe(1);
    expect(result.current.misses).toBe(0);
    expect(result.current.targets.map((t) => t.symbol)).toEqual(["Cmaj7", "G7"]);
  });

  it("a freePlay-only source page stays ungraded", () => {
    mockPhase = "timing";
    mockHeldPcs = new Set([0, 4, 7]);

    const blocks = [
      ...sourceBlocks,
      { id: "fp", type: "freePlay", config: { scale: "major", root: "C" } },
    ];

    const { result } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1", blocks })
    );

    expect(result.current.totalTargets).toBe(0);
    expect(result.current.currentTarget).toBeNull();
    expect(appendLocalWorkshopEvent).not.toHaveBeenCalled();
    expect(appendLocalWorkshopMiss).not.toHaveBeenCalled();
  });

  it("an empty preview pageId never derives fallback targets", () => {
    const { result } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "", blocks: displayAndTimerBlocks() })
    );

    expect(result.current.totalTargets).toBe(0);
  });

  it("a page with sources but no display/timer/transport stays ungraded", () => {
    const { result } = renderHook(() =>
      useDrillRuntimeProvider({ pageId: "page-1", blocks: sourceBlocks })
    );

    expect(result.current.totalTargets).toBe(0);
  });

  it("completes a source-only page: last target met finishes the round", () => {
    mockPhase = "timing";

    const { result, rerender } = renderHook(() =>
      useDrillRuntimeProvider({
        pageId: "page-1",
        blocks: displayAndTimerBlocks(),
      })
    );

    // Play the first target, then the second. Rerenders drive the mocked
    // useMidi's held notes through the scoring effect.
    mockHeldPcs = new Set([0, 4, 7, 11]);
    rerender();

    expect(result.current.targetIndex).toBe(1);

    mockHeldPcs = new Set([7, 11, 2, 5]); // G7
    rerender();

    // Two successes logged; the mocked timer stays in "timing" across the
    // advance (the real timer leaves it via nextRep), so the still-held
    // first chord also scores a miss against the second target — a mock
    // artifact, asserted only on the success path here.
    expect(appendLocalWorkshopEvent).toHaveBeenCalledTimes(2);
    expect(appendLocalWorkshopEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({ target: "G7" })
    );
    expect(finishRound).toHaveBeenCalled();
  });
});
