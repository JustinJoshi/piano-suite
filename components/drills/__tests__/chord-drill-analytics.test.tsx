import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChordDrill } from "@/components/drills/chord-drill/chord-drill";
import { useChordDrill, type ChordDrillEngine } from "@/hooks/useChordDrill";

vi.mock("@/lib/analytics", () => ({
  captureEvent: vi.fn(),
}));

import { captureEvent } from "@/lib/analytics";

vi.mock("@/hooks/useChordDrill");
vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: () => ({ canAccess: true, canPersist: true, canUseFloatPanel: true }),
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

const baseDrill = {
  midiSupported: true,
  midiConnected: true,
  midiInputs: [],
  selectedInputId: null,
  setSelectedInputId: vi.fn(),
  connectMidi: vi.fn(),
  heldNotes: [],
  heldNotesDisplay: [],
  mode: "single",
  setMode: vi.fn(),
  root: { pc: 0, name: "C", flat: false },
  setRoot: vi.fn(),
  qualityIdx: 0,
  setQualityIdx: vi.fn(),
  symbol: "Cmaj",
  chordNotes: ["C4", "E4", "G4"],
  targetPcs: new Set<number>(),
  familyList: [],
  phase: "idle",
  liveMs: 0,
  countdownValue: 0,
  breakRemaining: 0,
  running: false,
  justCompleted: false,
  repCount: 0,
  repTarget: 12,
  currentRepTarget: 12,
  setRepTarget: vi.fn(),
  repTimes: [],
  startDrill: vi.fn(),
  stopDrill: vi.fn(),
  nextChord: vi.fn(),
  redoChord: vi.fn(),
  history: {},
  resetStats: vi.fn(),
  showNotes: false,
  setShowNotes: vi.fn(),
  revealNotesOnFinish: false,
  setRevealNotesOnFinish: vi.fn(),
  requireExactNotes: false,
  setRequireExactNotes: vi.fn(),
  celebrateGood: false,
  setCelebrateGood: vi.fn(),
  perChordRepsEnabled: false,
  setPerChordRepsEnabled: vi.fn(),
  perChordReps: {},
  setPerChordRep: vi.fn(),
  clearPerChordReps: vi.fn(),
  showNewNotes: false,
  setShowNewNotes: vi.fn(),
  newCardRepBoost: false,
  setNewCardRepBoost: vi.fn(),
  newCardRepTarget: 12,
  setNewCardRepTarget: vi.fn(),
  currentCardQueue: null,
  ankiFollow: false,
  setAnkiFollow: vi.fn(),
  ankiStatus: "Follow off",
  deckStats: null,
  autoTimer: false,
  setAutoTimer: vi.fn(),
  countdownSeconds: 3,
  setCountdownSeconds: vi.fn(),
  hideChordUntilGo: false,
  setHideChordUntilGo: vi.fn(),
  startCountdownEnabled: false,
  setStartCountdownEnabled: vi.fn(),
  breakSeconds: 0,
  setBreakSeconds: vi.fn(),
  breakTickSound: false,
  setBreakTickSound: vi.fn(),
  autoGrade: false,
  setAutoGrade: vi.fn(),
  gradeThresholds: { good: 2000, hard: 5000 },
  setGoodThreshold: vi.fn(),
  setHardThreshold: vi.fn(),
  gradeStatus: "idle",
  lastGradeResult: null,
  confettiKey: 0,
  shuffleChord: vi.fn(),
} satisfies ChordDrillEngine;

function mockEngineFactory() {
  return vi.mocked(useChordDrill);
}

describe("ChordDrill analytics", () => {
  beforeEach(() => {
    vi.mocked(captureEvent).mockClear();
    mockEngineFactory().mockReset();
    mockEngineFactory().mockReturnValue(
      baseDrill as unknown as ReturnType<typeof useChordDrill>
    );
  });

  it("fires drill_started exactly once with the drill id when the drill starts", () => {
    const { rerender } = render(<ChordDrill />);
    expect(captureEvent).not.toHaveBeenCalled();

    mockEngineFactory().mockReturnValue({
      ...baseDrill,
      running: true,
      phase: "armed",
    } as unknown as ReturnType<typeof useChordDrill>);
    rerender(<ChordDrill />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith("drill_started", {
      drill: "chord-drill",
    });
  });

  it("fires nothing further when re-rendering without a phase change", () => {
    mockEngineFactory().mockReturnValue({
      ...baseDrill,
      running: true,
      phase: "armed",
    } as unknown as ReturnType<typeof useChordDrill>);
    const { rerender } = render(<ChordDrill />);
    expect(captureEvent).toHaveBeenCalledTimes(1);

    rerender(<ChordDrill />);
    rerender(<ChordDrill />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
  });

  it("fires drill_completed exactly once when the round finishes", () => {
    mockEngineFactory().mockReturnValue({
      ...baseDrill,
      running: true,
      phase: "armed",
    } as unknown as ReturnType<typeof useChordDrill>);
    const { rerender } = render(<ChordDrill />);
    vi.mocked(captureEvent).mockClear();

    mockEngineFactory().mockReturnValue({
      ...baseDrill,
      running: true,
      phase: "finished",
      justCompleted: true,
    } as unknown as ReturnType<typeof useChordDrill>);
    rerender(<ChordDrill />);
    rerender(<ChordDrill />);

    expect(captureEvent).toHaveBeenCalledTimes(1);
    expect(captureEvent).toHaveBeenCalledWith("drill_completed", {
      drill: "chord-drill",
    });
  });

  it("does not fire drill_completed before the drill starts", () => {
    render(<ChordDrill />);
    expect(captureEvent).not.toHaveBeenCalled();
    expect(screen.getByTestId("chord-drill")).toBeInTheDocument();
  });

  it("start button exists for the click-driven start path", () => {
    render(<ChordDrill />);
    fireEvent.click(screen.getByTestId("start-drill-btn"));
    expect(baseDrill.startDrill).toHaveBeenCalled();
  });
});
