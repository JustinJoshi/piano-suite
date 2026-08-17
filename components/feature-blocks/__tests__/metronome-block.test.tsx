import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MetronomeBlock } from "@/components/feature-blocks/metronome-block";

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

describe("MetronomeBlock", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    (globalThis as unknown as { __pianoSuiteAudioCtx?: unknown }).__pianoSuiteAudioCtx = undefined;
  });

  it("renders the BPM display and controls", () => {
    render(
      <MetronomeBlock
        bpm={90}
        beatsPerBar={4}
        accentFirstBeat
        minBpm={40}
        maxBpm={200}
      />
    );

    expect(screen.getByTestId("bpm-display")).toHaveTextContent("90 BPM");
    expect(screen.getByTestId("metronome-btn")).toHaveTextContent("Start Metronome");
    expect(screen.getByTestId("bpm-slider")).toHaveAttribute("min", "40");
    expect(screen.getByTestId("bpm-slider")).toHaveAttribute("max", "200");
  });

  it("toggles the metronome when the button is clicked", () => {
    render(
      <MetronomeBlock
        bpm={90}
        beatsPerBar={4}
        accentFirstBeat
        minBpm={40}
        maxBpm={200}
      />
    );

    const button = screen.getByTestId("metronome-btn");
    fireEvent.click(button);
    expect(button).toHaveTextContent("Stop Metronome");

    fireEvent.click(button);
    expect(button).toHaveTextContent("Start Metronome");
  });

  it("calls onBpmChange when used as a controlled component", () => {
    const onBpmChange = vi.fn();
    render(
      <MetronomeBlock
        bpm={80}
        onBpmChange={onBpmChange}
        beatsPerBar={4}
        accentFirstBeat
        minBpm={40}
        maxBpm={200}
      />
    );

    const slider = screen.getByTestId("bpm-slider");
    fireEvent.change(slider, { target: { value: "100" } });

    expect(onBpmChange).toHaveBeenCalledWith(100);
  });
});
