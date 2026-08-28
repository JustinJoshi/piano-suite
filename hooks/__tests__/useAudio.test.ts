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

  let time = 0;

  const ctx = {
    state: "running",
    get currentTime() {
      return time;
    },
    advance(ms: number) {
      time += ms / 1000;
    },
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
      mockCtx.advance(1000);
      vi.advanceTimersByTime(1000);
    });

    expect(onBeat).toHaveBeenCalledWith(1);
  });

  it("cycles beats based on the configured beatsPerBar", () => {
    const { result } = renderHook(() => useAudio());
    const onBeat = vi.fn();

    act(() => {
      result.current.startMetronome(60, onBeat, { beatsPerBar: 3 });
    });

    expect(onBeat).toHaveBeenCalledWith(0);

    act(() => {
      mockCtx.advance(1000);
      vi.advanceTimersByTime(1000);
    });
    expect(onBeat).toHaveBeenCalledWith(1);

    act(() => {
      mockCtx.advance(1000);
      vi.advanceTimersByTime(1000);
    });
    expect(onBeat).toHaveBeenCalledWith(2);

    act(() => {
      mockCtx.advance(1000);
      vi.advanceTimersByTime(1000);
    });
    // Should wrap back to 0 after 3 beats.
    expect(onBeat).toHaveBeenCalledWith(0);
  });

  it("accents the first beat when accentFirstBeat is true", () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      result.current.startMetronome(60, undefined, { accentFirstBeat: true });
    });

    // The first tick is the accented beat.
    expect(mockCtx.__oscillators[0].frequency.value).toBe(1200);

    act(() => {
      mockCtx.advance(1000);
      vi.advanceTimersByTime(1000);
    });

    // Subsequent ticks are unaccented.
    const unaccentedOsc = mockCtx.__oscillators[mockCtx.__oscillators.length - 1];
    expect(unaccentedOsc.frequency.value).toBe(880);
  });

  it("does not accent the first beat when accentFirstBeat is false", () => {
    const { result } = renderHook(() => useAudio());

    act(() => {
      result.current.startMetronome(60, undefined, { accentFirstBeat: false });
    });

    expect(mockCtx.__oscillators[0].frequency.value).toBe(880);
  });

  it("keeps scheduling beats past the initial window", () => {
    const { result } = renderHook(() => useAudio());
    const onBeat = vi.fn();

    act(() => {
      result.current.startMetronome(60, onBeat);
    });

    // Advance far enough that the initial 4-beat window would have expired.
    act(() => {
      mockCtx.advance(5000);
      vi.advanceTimersByTime(5000);
    });

    expect(onBeat).toHaveBeenCalledTimes(6);
  });
});
