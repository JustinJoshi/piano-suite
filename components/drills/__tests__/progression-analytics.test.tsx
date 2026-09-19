import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { Progression } from "@/components/drills/progression/progression";
import { useProgression, type ProgressionEngine } from "@/hooks/useProgression";
import type { Root } from "@/lib/music-theory";

vi.mock("@/lib/analytics", () => ({
  captureEvent: vi.fn(),
}));

import { captureEvent } from "@/lib/analytics";

vi.mock("@/hooks/useProgression");
vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: () => ({ canAccess: true, canPersist: true }),
}));
vi.mock("@/hooks/useAudioSettings", () => ({
  useAudioSettings: () => ({
    settings: { enabled: true, volume: 0.7, preset: "splendid-grand-piano", sustain: false, customKit: null },
    setEnabled: vi.fn(),
    setVolume: vi.fn(),
    setPreset: vi.fn(),
    setSustain: vi.fn(),
    setCustomKit: vi.fn(),
    loaded: true,
    engineState: "ready",
    setEngineState: vi.fn(),
  }),
}));

const cSharp: Root = { pc: 1, name: "C#", flat: false };

const baseDrill = {
  midiSupported: true,
  midiConnected: true,
  midiInputs: [],
  selectedInputId: null,
  setSelectedInputId: vi.fn(),
  connectMidi: vi.fn(),
  heldNotes: [],
  progressionType: "ii-V-I" as const,
  setProgressionType: vi.fn(),
  keyRoot: cSharp,
  setKeyRoot: vi.fn(),
  progression: {
    type: "ii-V-I" as const,
    label: "ii-V-I",
    steps: [
      { label: "ii", root: cSharp, quality: { suffix: "m7", tones: [] } },
      { label: "V", root: cSharp, quality: { suffix: "7", tones: [] } },
      { label: "I", root: cSharp, quality: { suffix: "maj7", tones: [] } },
    ],
  },
  currentStep: {
    label: "ii",
    root: cSharp,
    quality: { suffix: "m7", tones: [] },
    symbol: "C#m7",
    scale: "Dorian",
    targetPcs: new Set<number>(),
  },
  stepIdx: 0,
  loopCount: 0,
  phase: "idle" as const,
  liveMs: 0,
  running: false,
  startDrill: vi.fn(),
  stopDrill: vi.fn(),
  stats: undefined,
  resetStats: vi.fn(),
  ankiFlip: false,
  setAnkiFlip: vi.fn(),
  stepChime: false,
  setStepChime: vi.fn(),
  loopChime: false,
  setLoopChime: vi.fn(),
  ankiStatus: "Anki not detected",
} satisfies ProgressionEngine;

function mockEngineFactory() {
  return vi.mocked(useProgression);
}

function mockDrill(overrides: Partial<ProgressionEngine>) {
  mockEngineFactory().mockReturnValue({
    ...baseDrill,
    ...overrides,
  } as unknown as ReturnType<typeof useProgression>);
}

describe("Progression analytics", () => {
  beforeEach(() => {
    vi.mocked(captureEvent).mockClear();
    mockEngineFactory().mockReset();
    mockDrill({});
  });

  it("fires drill_started exactly once with the drill id when the drill starts", () => {
    const { rerender } = render(<Progression />);
    expect(captureEvent).not.toHaveBeenCalled();

    mockDrill({ running: true, phase: "timing" });
    rerender(<Progression />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith("drill_started", {
      drill: "progression",
    });
  });

  it("fires nothing further when re-rendering without a phase change", () => {
    mockDrill({ running: true, phase: "timing" });
    const { rerender } = render(<Progression />);
    expect(captureEvent).toHaveBeenCalledTimes(1);

    rerender(<Progression />);
    rerender(<Progression />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
  });

  it("fires drill_completed exactly once per completed loop", () => {
    mockDrill({ running: true, phase: "timing", loopCount: 0 });
    const { rerender } = render(<Progression />);
    vi.mocked(captureEvent).mockClear();

    mockDrill({ running: true, phase: "armed", loopCount: 1 });
    rerender(<Progression />);
    rerender(<Progression />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith("drill_completed", {
      drill: "progression",
    });
  });

  it("does not fire anything while idle", () => {
    render(<Progression />);
    expect(captureEvent).not.toHaveBeenCalled();
  });
});
