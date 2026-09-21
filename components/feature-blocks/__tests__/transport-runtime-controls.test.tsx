import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { StrictMode, useEffect } from "react";
import { TransportBlock } from "@/components/feature-blocks/transport-block";
import {
  DrillRuntimeProvider,
  useDrillRuntime,
} from "@/lib/drill-runtime";
import { useDrillRuntimeProvider } from "@/hooks/useDrillRuntime";
import type { DrillRuntime } from "@/lib/drill-runtime";

const start = vi.fn();
const cancel = vi.fn();
const finishRound = vi.fn();
const finishNow = vi.fn();
const nextRep = vi.fn();
const arm = vi.fn();

const startMetronome = vi.fn();
const stopMetronome = vi.fn();
let mockMetronomeRunning = false;

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

vi.mock("@/hooks/useAudio", () => ({
  useAudio: vi.fn(() => ({
    ready: true,
    playChime: vi.fn(),
    playTick: vi.fn(),
    startMetronome,
    stopMetronome,
    metronomeRunning: mockMetronomeRunning,
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

// Records the latest runtime value the block sees, so tests can assert on
// shared runtime state (stream tempo, target position) after UI events.
// Assigned from the probe's effect, outside render.
let latestRuntime: DrillRuntime | null = null;

function RuntimeProbe() {
  const runtime = useDrillRuntime();
  useEffect(() => {
    latestRuntime = runtime;
  }, [runtime]);
  return null;
}

function LiveHarness({
  blockProps,
  pageId = "page-1",
}: {
  blockProps: Record<string, unknown>;
  pageId?: string;
}) {
  const runtime = useDrillRuntimeProvider({
    pageId,
    clock: { bpm: 60, beatsPerBar: 4 },
    blocks: [
      {
        id: "t1",
        type: "transport",
        config: {
          bpm: 60,
          beatsPerBar: 4,
          rampEnabled: blockProps.rampEnabled === true,
          rampTargetBpm: 84,
          rampOverReps: 2,
        },
      },
      { id: "b1", type: "chordLibrary", config: { chords: "Cmaj7, Dm7" } },
      { id: "b2", type: "rhythmPattern", config: {} },
    ],
  });
  return (
    <DrillRuntimeProvider value={runtime}>
      <TransportBlock bpm={60} {...blockProps} />
      <RuntimeProbe />
    </DrillRuntimeProvider>
  );
}

describe("TransportBlock live runtime controls", () => {
  beforeEach(() => {
    mockPhase = "idle";
    mockHeldPcs = new Set();
    mockMetronomeRunning = false;
    latestRuntime = null;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("Start starts the round and emits drill_started exactly once under StrictMode", () => {
    render(
      <StrictMode>
        <LiveHarness blockProps={{}} />
      </StrictMode>
    );

    expect(captureEvent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("transport-btn"));

    expect(start).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith("drill_started", {
      pageId: "page-1",
    });
  });

  it("Stop resets the runtime phase and stops the audible metronome", () => {
    const { rerender } = render(
      <StrictMode>
        <LiveHarness blockProps={{}} />
      </StrictMode>
    );

    fireEvent.click(screen.getByTestId("transport-btn"));
    mockMetronomeRunning = true;
    act(() => {
      rerender(
        <StrictMode>
          <LiveHarness blockProps={{}} />
        </StrictMode>
      );
    });

    fireEvent.click(screen.getByTestId("transport-btn"));

    expect(stopMetronome).toHaveBeenCalled();
    expect(cancel).toHaveBeenCalled();
  });

  it("a reset from a separate DrillTimer stops the audible metronome", () => {
    mockPhase = "timing";
    const { rerender } = render(<LiveHarness blockProps={{}} />);

    fireEvent.click(screen.getByTestId("transport-btn"));
    mockMetronomeRunning = true;
    act(() => {
      rerender(<LiveHarness blockProps={{}} />);
    });
    expect(screen.getByTestId("transport-btn")).toHaveTextContent("Stop");
    stopMetronome.mockClear();

    // The timer block's own reset drives the phase back to idle without the
    // transport block being touched.
    mockPhase = "idle";
    act(() => {
      rerender(<LiveHarness blockProps={{}} />);
    });

    expect(stopMetronome).toHaveBeenCalled();
  });

  it("a slider move lifts the shared runtime tempo", () => {
    const { rerender } = render(<LiveHarness blockProps={{}} />);

    // 60bpm 4/4: the 16th-step stream lands at 250ms.
    expect(latestRuntime?.stream[1]?.onsetMs).toBe(250);

    fireEvent.change(screen.getByTestId("tempo-slider"), {
      target: { value: "120" },
    });
    act(() => {
      rerender(<LiveHarness blockProps={{}} />);
    });

    // The runtime re-composed its stream at the live 120bpm: 125ms.
    expect(latestRuntime?.stream[1]?.onsetMs).toBe(125);
    // And the slider shows the live tempo, not the saved 60.
    expect(screen.getByTestId("tempo-slider")).toHaveValue("120");
  });

  it("a ramp step makes tick and label match the runtime's bpm", () => {
    const { rerender } = render(
      <LiveHarness
        blockProps={{ rampEnabled: true, rampTargetBpm: 84, rampOverReps: 2 }}
      />
    );

    act(() => {
      latestRuntime?.setTargets([
        { id: "a", symbol: "C", notes: ["C"], pcs: new Set([0]) },
        { id: "b", symbol: "D", notes: ["D"], pcs: new Set([2]) },
      ]);
    });
    // Rep 0 of the 60→84 ramp: still 60.
    expect(screen.getByTestId("tempo-display")).toHaveTextContent("60 BPM");

    act(() => {
      latestRuntime?.skipTarget();
    });
    act(() => {
      rerender(
        <LiveHarness
          blockProps={{ rampEnabled: true, rampTargetBpm: 84, rampOverReps: 2 }}
        />
      );
    });

    // Rep 1 of 2: 72 — the label and the running tick agree with the runtime.
    expect(screen.getByTestId("tempo-display")).toHaveTextContent("72 BPM");
    mockMetronomeRunning = true;
    act(() => {
      rerender(
        <LiveHarness
          blockProps={{ rampEnabled: true, rampTargetBpm: 84, rampOverReps: 2 }}
        />
      );
    });
    expect(startMetronome).toHaveBeenLastCalledWith(
      72,
      expect.any(Function),
      expect.objectContaining({ beatsPerBar: 4 })
    );
  });
});
