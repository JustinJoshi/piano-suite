import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useRootCycling } from "@/hooks/useRootCycling";

const mockGetSetting = vi.fn().mockReturnValue(null);
const mockLogEvent = vi.fn().mockResolvedValue(undefined);

vi.mock("convex/react", () => ({
  useQuery: vi.fn((query: unknown, args: unknown) => {
    void query;
    if (args === "skip") return undefined;
    return mockGetSetting();
  }),
  useMutation: vi.fn((mutation: unknown) => {
    void mutation;
    return mockLogEvent;
  }),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    settings: {
      getSetting: "getSetting",
      setSetting: "setSetting",
    },
    tracking: {
      logRootCycleEvent: "logRootCycleEvent",
    },
    users: {
      ensureCurrentUser: "ensureCurrentUser",
    },
  },
}));

vi.mock("@/hooks/useMidi", () => ({
  useMidi: vi.fn(() => ({
    supported: true,
    connected: false,
    inputs: [],
    selectedInputId: null,
    setSelectedInputId: vi.fn(),
    heldNotes: [],
    connect: vi.fn(),
    error: null,
  })),
}));

vi.mock("@/hooks/useAudio", () => ({
  useAudio: vi.fn(() => ({
    ready: true,
    playChime: vi.fn(),
    playTick: vi.fn(),
    startMetronome: vi.fn(),
    stopMetronome: vi.fn(),
    metronomeRunning: false,
  })),
}));

const heldPcs = new Set<number>();

function dispatchNoteOn(pc: number) {
  heldPcs.add(pc);
  window.dispatchEvent(
    new CustomEvent("midi-note-on", { detail: { note: pc + 60, pc } })
  );
}

function dispatchNoteOff(pc: number) {
  heldPcs.delete(pc);
  window.dispatchEvent(
    new CustomEvent("midi-note-off", { detail: { note: pc + 60, pc } })
  );
}

function playChord(pcs: number[]) {
  releaseAll();
  pcs.forEach((pc) => dispatchNoteOn(pc));
}

function releaseAll() {
  const pcs = Array.from(heldPcs);
  pcs.forEach((pc) => dispatchNoteOff(pc));
}

describe("useRootCycling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSetting.mockReturnValue(null);
    mockLogEvent.mockResolvedValue(undefined);
    heldPcs.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes in chord mode with m7 and idle phase", async () => {
    const { result } = renderHook(() => useRootCycling(true));

    await waitFor(() => {
      expect(result.current.mode).toBe("chord");
    });

    expect(result.current.quality.suffix).toBe("m7");
    expect(result.current.phase).toBe("idle");
    expect(result.current.running).toBe(false);
    expect(result.current.includedPcs).toHaveLength(12);
  });

  it("starts chord drill and times a correct chord", async () => {
    const { result } = renderHook(() => useRootCycling(true));

    await waitFor(() => expect(result.current.mode).toBe("chord"));

    act(() => result.current.startDrill());

    expect(result.current.running).toBe(true);
    expect(result.current.phase).toBe("timing");

    const root = result.current.root;
    expect(root).not.toBeNull();

    // Play the current m7 chord (root + 3 + 7 + 10).
    const targetPcs = [
      root!.pc,
      (root!.pc + 3) % 12,
      (root!.pc + 7) % 12,
      (root!.pc + 10) % 12,
    ];
    act(() => playChord(targetPcs));

    await waitFor(() => {
      expect(result.current.phase).toBe("success");
      expect(result.current.repCount).toBe(1);
    });

    expect(mockLogEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "chord",
        quality: "m7",
        root: root!.name,
      })
    );
  });

  it("arms when hands are down at start and starts timing on lift", async () => {
    const { result } = renderHook(() => useRootCycling(true));

    await waitFor(() => expect(result.current.mode).toBe("chord"));

    act(() => playChord([0, 4, 7]));
    act(() => result.current.startDrill());

    expect(result.current.phase).toBe("armed");

    act(() => releaseAll());

    await waitFor(() => {
      expect(result.current.phase).toBe("timing");
    });
  });

  it("does not advance on an incorrect chord", async () => {
    const { result } = renderHook(() => useRootCycling(true));

    await waitFor(() => expect(result.current.mode).toBe("chord"));

    act(() => result.current.startDrill());

    act(() => playChord([0, 4, 7, 11])); // wrong chord

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(result.current.phase).toBe("timing");
    expect(result.current.repCount).toBe(0);
  });

  it("switches to arpeggio mode and completes a lap", async () => {
    const { result } = renderHook(() => useRootCycling(true));

    await waitFor(() => expect(result.current.mode).toBe("chord"));

    act(() => result.current.setMode("arpeggio"));

    await waitFor(() => expect(result.current.mode).toBe("arpeggio"));

    act(() => result.current.startDrill());

    await waitFor(() => expect(result.current.phase).toBe("awaiting-root"));

    const root = result.current.root;
    expect(root).not.toBeNull();

    // Hold LH pedal (root + 5th).
    act(() => playChord([root!.pc, (root!.pc + 7) % 12]));

    await waitFor(() => expect(result.current.phase).toBe("sequence"));

    // Play the 7-note RH cell: 9, b3, 11, 5, b7, 9, 11.
    const rh = [2, 3, 5, 7, 10, 2, 5];
    for (let i = 0; i < rh.length; i++) {
      act(() => {
        releaseAll();
        dispatchNoteOn((root!.pc + rh[i]) % 12);
      });
      if (i < rh.length - 1) {
        await waitFor(() =>
          expect(result.current.sequenceTargetIdx).toBe(i + 1)
        );
      }
    }

    await waitFor(() => {
      expect(result.current.repCount).toBe(1);
      expect(result.current.sequenceTargetIdx).toBe(0);
    });

    const arpeggioLogs = mockLogEvent.mock.calls.filter(
      (call) => call[0]?.mode === "arpeggio"
    );
    expect(arpeggioLogs).toHaveLength(7);
  });

  it("skips to the next root", async () => {
    const { result } = renderHook(() => useRootCycling(true));

    await waitFor(() => expect(result.current.mode).toBe("chord"));

    act(() => result.current.startDrill());

    const firstRoot = result.current.root;
    act(() => result.current.skipToNextRoot());

    await waitFor(() => {
      expect(result.current.root).not.toBeNull();
      expect(result.current.root?.pc).not.toBe(firstRoot?.pc);
    });
  });

  it("stops the drill", async () => {
    const { result } = renderHook(() => useRootCycling(true));

    await waitFor(() => expect(result.current.mode).toBe("chord"));

    act(() => result.current.startDrill());
    act(() => result.current.stopDrill());

    expect(result.current.phase).toBe("idle");
    expect(result.current.running).toBe(false);
  });
});
