import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChordSetBlock } from "@/components/feature-blocks/chord-set-block";
import { DrillRuntimeProvider } from "@/lib/drill-runtime";
import type { DrillRuntime, ChordTarget } from "@/lib/drill-runtime";

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
    start: vi.fn(),
    reset: vi.fn(),
    setTargets: vi.fn(),
    skipTarget: vi.fn(),
    registerTargetSource: vi.fn(() => vi.fn()),
    activeTargetSource: "chordSet",
    ...overrides,
  };
}

describe("ChordSetBlock", () => {
  it("renders current chord symbol and notes", async () => {
    render(
      <DrillRuntimeProvider value={createRuntime()}>
        <ChordSetBlock
          roots={["C"]}
          qualityGroups={["7th"]}
          order="sequential"
          requireExact={false}
          goodThreshold={0}
          hardThreshold={2}
        />
      </DrillRuntimeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Cmaj7")).toBeInTheDocument();
    });
    expect(screen.getByText("C E G B")).toBeInTheDocument();
  });

  it("calls setTargets on mount", async () => {
    const setTargets = vi.fn();
    render(
      <DrillRuntimeProvider value={createRuntime({ setTargets })}>
        <ChordSetBlock
          roots={["C"]}
          qualityGroups={["7th"]}
          order="sequential"
          requireExact={false}
          goodThreshold={0}
          hardThreshold={2}
        />
      </DrillRuntimeProvider>
    );

    await waitFor(() => {
      expect(setTargets).toHaveBeenCalled();
    });
  });

  it("calls skipTarget when skip is clicked", async () => {
    const skipTarget = vi.fn();
    render(
      <DrillRuntimeProvider value={createRuntime({ skipTarget })}>
        <ChordSetBlock
          roots={["C"]}
          qualityGroups={["7th"]}
          order="sequential"
          requireExact={false}
          goodThreshold={0}
          hardThreshold={2}
        />
      </DrillRuntimeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Cmaj7")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(skipTarget).toHaveBeenCalled();
  });

  it("displays miss count", () => {
    render(
      <DrillRuntimeProvider value={createRuntime({ misses: 3 })}>
        <ChordSetBlock
          roots={["C"]}
          qualityGroups={["7th"]}
          order="sequential"
          requireExact={false}
          goodThreshold={0}
          hardThreshold={2}
        />
      </DrillRuntimeProvider>
    );

    expect(screen.getByText("Misses: 3")).toBeInTheDocument();
  });
});
