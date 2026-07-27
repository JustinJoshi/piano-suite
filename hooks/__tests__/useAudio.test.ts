import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAudio } from "@/hooks/useAudio";

function createMockAudioContext() {
  const oscillators: Array<{
    connect: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    type: string;
    frequency: { value: number };
  }> = [];
  const gains: Array<{
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    gain: {
      setValueAtTime: ReturnType<typeof vi.fn>;
      exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    };
  }> = [];

  const ctx = {
    state: "running",
    currentTime: 0,
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => {
      const osc = {
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
        type: "sine",
        frequency: { value: 0 },
      };
      oscillators.push(osc);
      return osc;
    }),
    createGain: vi.fn(() => {
      const gain = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
      };
      gains.push(gain);
      return gain;
    }),
    destination: {},
    __oscillators: oscillators,
    __gains: gains,
  };

  return ctx;
}

describe("useAudio", () => {
  let mockCtx: ReturnType<typeof createMockAudioContext>;

  beforeEach(() => {
    mockCtx = createMockAudioContext();
    vi.stubGlobal(
      "AudioContext",
      vi.fn(function () {
        return mockCtx;
      })
    );
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    // Clear shared audio context between tests.
    (globalThis as unknown as { __pianoSuiteAudioCtx?: unknown }).__pianoSuiteAudioCtx = undefined;
  });

  it("returns ready=true when AudioContext is available", () => {
    const { result } = renderHook(() => useAudio());
    expect(result.current.ready).toBe(true);
  });

  it("plays a chime", () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      result.current.playChime();
    });

    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
    expect(mockCtx.__oscillators[0].start).toHaveBeenCalled();
  });

  it("plays a tick with a different frequency", () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      result.current.playTick({ frequency: 440 });
    });

    expect(mockCtx.__oscillators[0].frequency.value).toBe(440);
  });

  it("starts and stops a metronome", () => {
    const { result } = renderHook(() => useAudio());

    let controls: ReturnType<typeof result.current.startMetronome>;
    act(() => {
      controls = result.current.startMetronome(120);
    });

    expect(result.current.metronomeRunning).toBe(true);
    expect(mockCtx.createOscillator).toHaveBeenCalled();

    act(() => {
      controls.stop();
    });

    expect(result.current.metronomeRunning).toBe(false);
  });

  it("calls onBeat callback for each metronome tick", () => {
    const { result } = renderHook(() => useAudio());
    const onBeat = vi.fn();

    act(() => {
      result.current.startMetronome(60, onBeat);
    });

    expect(onBeat).toHaveBeenCalledWith(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onBeat).toHaveBeenCalledWith(1);
  });
});
