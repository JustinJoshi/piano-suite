import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useArpeggios } from "@/hooks/useArpeggios";

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
      logArpeggioTransition: "logArpeggioTransition",
      logArpeggioMiss: "logArpeggioMiss",
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

vi.mock("@/hooks/useAnkiSync", () => ({
  useAnkiSync: vi.fn(() => ({
    status: "off",
    parsedCard: null,
    deckStats: null,
    isFollowing: false,
    refresh: vi.fn(),
  })),
}));

describe("useArpeggios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSetting.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with the first arpeggio chord", async () => {
    const { result } = renderHook(() => useArpeggios(true));

    await waitFor(() => {
      expect(result.current.chord?.id).toBe("Bbm11");
    });

    expect(result.current.phase).toBe("awaiting-root");
    expect(result.current.targetIdx).toBe(0);
    expect(result.current.lapCount).toBe(0);
    expect(result.current.missCount).toBe(0);
  });

  it("advances to sequence when the LH pedal is held", async () => {
    const { result } = renderHook(() => useArpeggios(true));

    await waitFor(() => {
      expect(result.current.chord?.id).toBe("Bbm11");
    });

    // Bbm11 LH pedal: Bb(10), F(5), Ab(8)
    act(() => {
      window.dispatchEvent(
        new CustomEvent("midi-note-on", { detail: { note: 70, pc: 10 } })
      );
      window.dispatchEvent(
        new CustomEvent("midi-note-on", { detail: { note: 65, pc: 5 } })
      );
      window.dispatchEvent(
        new CustomEvent("midi-note-on", { detail: { note: 68, pc: 8 } })
      );
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("sequence");
    });
  });

  it("advances target on correct sequence note and logs a transition", async () => {
    const { result } = renderHook(() => useArpeggios(true));

    await waitFor(() => {
      expect(result.current.chord?.id).toBe("Bbm11");
    });

    // Hold LH pedal
    act(() => {
      [10, 5, 8].forEach((pc) =>
        window.dispatchEvent(new CustomEvent("midi-note-on", { detail: { note: pc + 60, pc } }))
      );
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("sequence");
    });

    // First RH note of Bbm11 is C (pc 0)
    act(() => {
      window.dispatchEvent(new CustomEvent("midi-note-on", { detail: { note: 60, pc: 0 } }));
    });

    await waitFor(() => {
      expect(result.current.targetIdx).toBe(1);
    });
  });

  it("increments miss count on wrong sequence note", async () => {
    const { result } = renderHook(() => useArpeggios(true));

    await waitFor(() => {
      expect(result.current.chord?.id).toBe("Bbm11");
    });

    // Hold LH pedal
    act(() => {
      [10, 5, 8].forEach((pc) =>
        window.dispatchEvent(new CustomEvent("midi-note-on", { detail: { note: pc + 60, pc } }))
      );
    });

    await waitFor(() => {
      expect(result.current.phase).toBe("sequence");
    });

    // Wrong note (D = pc 2 instead of C = pc 0)
    act(() => {
      window.dispatchEvent(new CustomEvent("midi-note-on", { detail: { note: 62, pc: 2 } }));
    });

    await waitFor(() => {
      expect(result.current.missCount).toBe(1);
    });
  });
});
