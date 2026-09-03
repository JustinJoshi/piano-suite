import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransportBlock } from "@/components/feature-blocks/transport-block";

function createMockAudioContext() {
  return {
    state: "running",
    currentTime: 0,
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      type: "sine",
      frequency: { value: 0 },
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    })),
    destination: {},
  };
}

describe("TransportBlock", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    (globalThis as unknown as { __pianoSuiteAudioCtx?: unknown }).__pianoSuiteAudioCtx = undefined;
  });

  it("renders tempo, meter, and count-in", () => {
    render(<TransportBlock bpm={90} beatsPerBar={3} countInBars={2} />);

    expect(screen.getByTestId("tempo-display")).toHaveTextContent("90 BPM");
    expect(screen.getByText("3/4")).toBeInTheDocument();
    expect(screen.getByText("2 bars")).toBeInTheDocument();
  });

  it("toggles between start and stop", () => {
    render(<TransportBlock />);

    const button = screen.getByTestId("transport-btn");
    fireEvent.click(button);
    expect(button).toHaveTextContent("Stop");

    fireEvent.click(button);
    expect(button).toHaveTextContent("Start");
  });

  it("renders the loop range when looping is on", () => {
    render(<TransportBlock loopEnabled loopStartBar={4} loopEndBar={8} />);

    expect(screen.getByText(/Loop: bars 4–8/)).toBeInTheDocument();
  });

  it("renders the ramp indicator when the ramp is on", () => {
    render(<TransportBlock bpm={60} rampEnabled rampTargetBpm={120} />);

    expect(screen.getByText(/60 → 120 BPM/)).toBeInTheDocument();
  });

  it("reports slider moves through onBpmChange when controlled", () => {
    const onBpmChange = vi.fn();
    render(<TransportBlock bpm={80} onBpmChange={onBpmChange} />);

    fireEvent.change(screen.getByTestId("tempo-slider"), {
      target: { value: "100" },
    });
    expect(onBpmChange).toHaveBeenCalledWith(100);
  });
});
