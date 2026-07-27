import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useProgression } from "@/hooks/useProgression";
import { chordSymbol } from "@/lib/progression";

const mockGetSetting = vi.fn().mockReturnValue(null);

vi.mock("convex/react", () => ({
  useQuery: vi.fn((query: unknown, args: unknown) => {
    void query;
    if (args === "skip") return undefined;
    return mockGetSetting();
  }),
  useMutation: vi.fn((mutation: unknown) => {
    void mutation;
    return vi.fn().mockResolvedValue(undefined);
  }),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    settings: {
      getSetting: "getSetting",
      setSetting: "setSetting",
    },
    tracking: {
      logProgressionEvent: "logProgressionEvent",
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

vi.mock("@/lib/anki", () => ({
  pingAnki: vi.fn().mockResolvedValue(false),
  flipCurrentCard: vi.fn().mockResolvedValue(undefined),
  gradeCurrentCard: vi.fn().mockResolvedValue(undefined),
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

describe("useProgression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSetting.mockReturnValue(null);
    heldPcs.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with ii-V-I in C and idle phase", async () => {
    const { result } = renderHook(() => useProgression(true));

    await waitFor(() => {
      expect(result.current.progressionType).toBe("ii-V-I");
    });

    expect(result.current.keyRoot.name).toBe("C");
    expect(result.current.currentStep.symbol).toBe("Dm7");
    expect(result.current.progression.steps.map((s) => chordSymbol(s))).toEqual([
      "Dm7",
      "G7",
      "Cmaj7",
    ]);
    expect(result.current.phase).toBe("idle");
    expect(result.current.stepIdx).toBe(0);
    expect(result.current.loopCount).toBe(0);
  });

  it("starts timing immediately when hands are empty at start", async () => {
    const { result } = renderHook(() => useProgression(true));

    await waitFor(() => {
      expect(result.current.progressionType).toBe("ii-V-I");
    });

    act(() => {
      result.current.startDrill();
    });

    expect(result.current.phase).toBe("timing");
    expect(result.current.running).toBe(true);
  });

  it("arms when hands are on keys and transitions to timing on lift", async () => {
    const { result } = renderHook(() => useProgression(true));

    await waitFor(() => {
      expect(result.current.progressionType).toBe("ii-V-I");
    });

    act(() => playChord([2, 5, 9, 0]));

    act(() => {
      result.current.startDrill();
    });

    expect(result.current.phase).toBe("armed");

    act(() => {
      releaseAll();
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("timing");
    });
  });

  it("advances to the next step after a correct chord", async () => {
    const { result } = renderHook(() => useProgression(true));

    await waitFor(() => {
      expect(result.current.progressionType).toBe("ii-V-I");
    });

    act(() => result.current.startDrill());
    act(() => releaseAll());

    await waitFor(() => expect(result.current.phase).toBe("timing"));

    // Dm7: D(2), F(5), A(9), C(0)
    act(() => playChord([2, 5, 9, 0]));

    await waitFor(() => {
      expect(result.current.stepIdx).toBe(1);
      expect(result.current.phase).toBe("success");
    });
  });

  it("completes a loop and updates history after all steps", async () => {
    const { result } = renderHook(() => useProgression(true));

    await waitFor(() => {
      expect(result.current.progressionType).toBe("ii-V-I");
    });

    act(() => result.current.startDrill());

    const chords = [
      [2, 5, 9, 0], // Dm7
      [7, 11, 2, 5], // G7
      [0, 4, 7, 11], // Cmaj7
    ];

    for (const chord of chords) {
      act(() => releaseAll());
      await waitFor(() => expect(result.current.phase).toBe("timing"));
      act(() => playChord(chord));
      if (chord !== chords[chords.length - 1]) {
        await waitFor(() => expect(result.current.phase).toBe("success"));
      }
    }

    await waitFor(() => {
      expect(result.current.loopCount).toBe(1);
      expect(result.current.stepIdx).toBe(0);
      expect(result.current.stats?.totalLoops).toBe(1);
    });
  });

  it("does not advance on an incorrect chord", async () => {
    const { result } = renderHook(() => useProgression(true));

    await waitFor(() => {
      expect(result.current.progressionType).toBe("ii-V-I");
    });

    act(() => result.current.startDrill());
    act(() => releaseAll());

    await waitFor(() => expect(result.current.phase).toBe("timing"));

    // Wrong chord (Cmaj7 instead of Dm7)
    act(() => playChord([0, 4, 7, 11]));

    // Give it a moment; it should stay on step 0.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(result.current.stepIdx).toBe(0);
    expect(result.current.phase).toBe("timing");
  });

  it("stops the drill and returns to idle", async () => {
    const { result } = renderHook(() => useProgression(true));

    await waitFor(() => {
      expect(result.current.progressionType).toBe("ii-V-I");
    });

    act(() => result.current.startDrill());
    act(() => result.current.stopDrill());

    expect(result.current.phase).toBe("idle");
    expect(result.current.running).toBe(false);
  });

  it("changes progression type via settings", async () => {
    const { result } = renderHook(() => useProgression(true));

    await waitFor(() => {
      expect(result.current.progressionType).toBe("ii-V-I");
    });

    act(() => result.current.setProgressionType("blues12"));

    await waitFor(() => {
      expect(result.current.progressionType).toBe("blues12");
    });

    expect(result.current.progression.steps).toHaveLength(12);
  });
});
