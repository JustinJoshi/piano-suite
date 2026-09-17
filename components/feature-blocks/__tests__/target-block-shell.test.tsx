import { afterEach, describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { TargetBlockShell } from "@/components/feature-blocks/target-block-shell";
import { DrillRuntimeProvider } from "@/lib/drill-runtime";
import type { DrillRuntime, ChordTarget } from "@/lib/drill-runtime";
import {
  pressVirtualNote,
  releaseAllVirtualNotes,
  __resetMidiSessionForTests,
} from "@/lib/midi-session";

const cMajor7: ChordTarget = {
  id: "Cmaj7",
  symbol: "Cmaj7",
  notes: ["C", "E", "G", "B"],
  pcs: new Set([0, 4, 7, 11]),
};

function createRuntime(overrides: Partial<DrillRuntime> = {}): DrillRuntime {
  return {
    pageId: "page-1",
    phase: "idle",
    liveMs: 0,
    countdownValue: 0,
    breakRemaining: 0,
    currentTarget: cMajor7,
    targetIndex: 0,
    totalTargets: 3,
    misses: 0,
    start: () => {},
    reset: () => {},
    setTargets: () => {},
    skipTarget: () => {},
    registerTargetSource: () => () => {},
    activeTargetSource: "chordSet",
    ...overrides,
  };
}

describe("TargetBlockShell held-notes readout", () => {
  afterEach(() => {
    releaseAllVirtualNotes();
    __resetMidiSessionForTests();
  });

  it("shows 'No keys held' when nothing is held", () => {
    render(
      <DrillRuntimeProvider value={createRuntime()}>
        <TargetBlockShell
          label="Chord target"
          state={{ isActive: true, isSuperseded: false, hasRuntime: true }}
        />
      </DrillRuntimeProvider>
    );

    expect(screen.getByText("No keys held")).toBeInTheDocument();
  });

  it("shows held note names once keys are pressed", async () => {
    render(
      <DrillRuntimeProvider value={createRuntime()}>
        <TargetBlockShell
          label="Chord target"
          state={{ isActive: true, isSuperseded: false, hasRuntime: true }}
        />
      </DrillRuntimeProvider>
    );

    act(() => {
      pressVirtualNote(60);
      pressVirtualNote(64);
    });

    await waitFor(() => {
      expect(screen.getByText("Holding: C E")).toBeInTheDocument();
    });
  });
});
