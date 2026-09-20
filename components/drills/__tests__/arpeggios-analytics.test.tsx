import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { Arpeggios } from "@/components/drills/arpeggios/arpeggios";
import { useArpeggios, type ArpeggioEngine } from "@/hooks/useArpeggios";

vi.mock("@/lib/analytics", () => ({
  captureEvent: vi.fn(),
}));

import { captureEvent } from "@/lib/analytics";

vi.mock("@/hooks/useArpeggios");
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

const baseChord = {
  id: "Cm11",
  root: 0,
  lh: [
    { pc: 0, name: "C" },
    { pc: 7, name: "G" },
  ],
  rh: [
    { pc: 0, name: "C", deg: "1" },
    { pc: 3, name: "Eb", deg: "b3" },
  ],
};

const baseDrill = {
  midiSupported: true,
  midiConnected: true,
  midiInputs: [],
  selectedInputId: null,
  setSelectedInputId: vi.fn(),
  connectMidi: vi.fn(),
  heldNotes: [],
  chord: baseChord,
  chordIdx: 0,
  progressText: "chord 1 of 1",
  phase: "idle" as const,
  targetIdx: 0,
  lapCount: 0,
  missCount: 0,
  missesThisLap: 0,
  liveMs: 0,
  recentHistory: [],
  flash: false,
  successFlash: false,
  countdownValue: 0,
  breakRemaining: 0,
  restartChord: vi.fn(),
  nextChord: vi.fn(),
  flashOnMiss: false,
  setFlashOnMiss: vi.fn(),
  showLh: true,
  setShowLh: vi.fn(),
  lapChime: false,
  setLapChime: vi.fn(),
  config: { order: ["Cm11"], excluded: [] },
  toggleChordIncluded: vi.fn(),
  moveChord: vi.fn(),
  resetOrder: vi.fn(),
  ignoredPcs: [],
  toggleIgnoredPc: vi.fn(),
  setIgnoredPcs: vi.fn(),
  autoFilter: false,
  setAutoFilter: vi.fn(),
  ankiFollow: false,
  setAnkiFollow: vi.fn(),
  ankiStatus: "Follow off",
  deckStats: null,
  autoTimer: false,
  setAutoTimer: vi.fn(),
  hideChordUntilGo: false,
  setHideChordUntilGo: vi.fn(),
  countdownSeconds: 3,
  setCountdownSeconds: vi.fn(),
  breakSeconds: 0,
  setBreakSeconds: vi.fn(),
  breakTickSound: false,
  setBreakTickSound: vi.fn(),
  autoGrade: false,
  setAutoGrade: vi.fn(),
  missThresholds: { good: 0, hard: 2 },
  setGoodMisses: vi.fn(),
  setHardMisses: vi.fn(),
  gradeStatus: "idle" as const,
  lastGradeResult: null,
} satisfies ArpeggioEngine;

function mockEngineFactory() {
  return vi.mocked(useArpeggios);
}

function mockDrill(overrides: Partial<ArpeggioEngine>) {
  mockEngineFactory().mockReturnValue({
    ...baseDrill,
    ...overrides,
  } as unknown as ReturnType<typeof useArpeggios>);
}

describe("Arpeggios analytics", () => {
  beforeEach(() => {
    vi.mocked(captureEvent).mockClear();
    mockEngineFactory().mockReset();
    mockDrill({});
  });

  it("fires drill_started exactly once with the drill id when the phase leaves idle", () => {
    const { rerender } = render(<Arpeggios />);
    expect(captureEvent).not.toHaveBeenCalled();

    mockDrill({ phase: "awaiting-root" });
    rerender(<Arpeggios />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith("drill_started", {
      drill: "arpeggios",
    });
  });

  it("fires nothing further when re-rendering without a phase change", () => {
    mockDrill({ phase: "awaiting-root" });
    const { rerender } = render(<Arpeggios />);
    expect(captureEvent).toHaveBeenCalledTimes(1);

    rerender(<Arpeggios />);
    rerender(<Arpeggios />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
  });

  it("fires drill_completed exactly once per completed lap", () => {
    mockDrill({ phase: "sequence", lapCount: 0 });
    const { rerender } = render(<Arpeggios />);
    vi.mocked(captureEvent).mockClear();

    mockDrill({ phase: "complete", lapCount: 1 });
    rerender(<Arpeggios />);
    rerender(<Arpeggios />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith("drill_completed", {
      drill: "arpeggios",
    });
  });

  it("fires drill_completed again after a re-arm resets the lap count", () => {
    mockDrill({ phase: "sequence", lapCount: 0 });
    const { rerender } = render(<Arpeggios />);
    vi.mocked(captureEvent).mockClear();

    // First lap completes.
    mockDrill({ phase: "complete", lapCount: 1 });
    rerender(<Arpeggios />);
    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith("drill_completed", {
      drill: "arpeggios",
    });
    vi.mocked(captureEvent).mockClear();

    // Re-arm (armChord runs on every chord change / Anki card flip):
    // lapCount resets to 0 — nothing may fire.
    mockDrill({ phase: "awaiting-root", lapCount: 0 });
    rerender(<Arpeggios />);
    rerender(<Arpeggios />);
    expect(captureEvent).not.toHaveBeenCalled();

    // The next finished lap emits again.
    mockDrill({ phase: "complete", lapCount: 1 });
    rerender(<Arpeggios />);
    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith("drill_completed", {
      drill: "arpeggios",
    });
  });

  it("does not fire anything while idle", () => {
    render(<Arpeggios />);
    expect(captureEvent).not.toHaveBeenCalled();
  });
});
