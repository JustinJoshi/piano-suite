import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { RootCycling } from "@/components/drills/root-cycling/root-cycling";
import { useRootCycling, type RootCyclingEngine } from "@/hooks/useRootCycling";
import type { Root } from "@/lib/music-theory";

vi.mock("@/lib/analytics", () => ({
  captureEvent: vi.fn(),
}));

import { captureEvent } from "@/lib/analytics";

vi.mock("@/hooks/useRootCycling");
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
  mode: "chord" as const,
  setMode: vi.fn(),
  quality: { suffix: "maj", tones: [] },
  qualityIdx: 0,
  setQualityIdx: vi.fn(),
  includedPcs: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  toggleRootIncluded: vi.fn(),
  resetRoots: vi.fn(),
  root: cSharp,
  phase: "timing" as const,
  running: false,
  repCount: 0,
  missCount: 0,
  liveMs: 0,
  recentHistory: [],
  startDrill: vi.fn(),
  stopDrill: vi.fn(),
  skipToNextRoot: vi.fn(),
  promptLabel: "play it",
  promptSymbol: "C#maj",
  lhNotes: [],
  targetDegree: null,
  targetNote: null,
  sequenceDegrees: [],
  sequenceTargetIdx: 0,
} satisfies RootCyclingEngine;

function mockEngineFactory() {
  return vi.mocked(useRootCycling);
}

function mockDrill(overrides: Partial<RootCyclingEngine>) {
  mockEngineFactory().mockReturnValue({
    ...baseDrill,
    ...overrides,
  } as unknown as ReturnType<typeof useRootCycling>);
}

describe("RootCycling analytics", () => {
  beforeEach(() => {
    vi.mocked(captureEvent).mockClear();
    mockEngineFactory().mockReset();
    mockDrill({});
  });

  it("fires drill_started exactly once with the drill id when the drill starts", () => {
    const { rerender } = render(<RootCycling />);
    expect(captureEvent).not.toHaveBeenCalled();

    mockDrill({ running: true });
    rerender(<RootCycling />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith("drill_started", {
      drill: "root-cycling",
    });
  });

  it("fires nothing further when re-rendering without a phase change", () => {
    mockDrill({ running: true });
    const { rerender } = render(<RootCycling />);
    expect(captureEvent).toHaveBeenCalledTimes(1);

    rerender(<RootCycling />);
    rerender(<RootCycling />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
  });

  it("fires drill_completed exactly once per completed rep", () => {
    mockDrill({ running: true, phase: "timing", repCount: 0 });
    const { rerender } = render(<RootCycling />);
    vi.mocked(captureEvent).mockClear();

    mockDrill({ running: true, phase: "success", repCount: 1 });
    rerender(<RootCycling />);
    rerender(<RootCycling />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith("drill_completed", {
      drill: "root-cycling",
    });
  });

  it("does not fire anything while idle", () => {
    render(<RootCycling />);
    expect(captureEvent).not.toHaveBeenCalled();
  });
});
