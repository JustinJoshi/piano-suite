import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScaleRunnerBlock } from "@/components/feature-blocks/scale-runner-block";
import { RootCycleBlock } from "@/components/feature-blocks/root-cycle-block";
import { ProgressionBlock } from "@/components/feature-blocks/progression-block";
import { DrillRuntimeProvider } from "@/lib/drill-runtime";
import type { DrillRuntime, ChordTarget } from "@/lib/drill-runtime";
import { scaleRunnerDefaultConfig } from "@/lib/feature-blocks/scale-runner/config";
import { rootCycleDefaultConfig } from "@/lib/feature-blocks/root-cycle/config";
import { progressionDefaultConfig } from "@/lib/feature-blocks/progression/config";

const dTarget: ChordTarget = {
  id: "D",
  symbol: "D",
  notes: ["D (2)"],
  pcs: new Set([2]),
};

function createRuntime(
  activeTargetSource: string | null,
  overrides: Partial<DrillRuntime> = {}
): DrillRuntime {
  return {
    pageId: "page-1",
    phase: "idle",
    liveMs: 0,
    countdownValue: 0,
    breakRemaining: 0,
    currentTarget: dTarget,
    targetIndex: 1,
    totalTargets: 8,
    misses: 0,
    start: vi.fn(),
    reset: vi.fn(),
    setTargets: vi.fn(),
    skipTarget: vi.fn(),
    registerTargetSource: vi.fn(() => vi.fn()),
    activeTargetSource,
    ...overrides,
  };
}

describe("ScaleRunnerBlock", () => {
  it("labels the configured run and lists its notes", () => {
    render(
      <DrillRuntimeProvider value={createRuntime("scaleRunner")}>
        <ScaleRunnerBlock {...scaleRunnerDefaultConfig} />
      </DrillRuntimeProvider>
    );

    expect(screen.getByText("C Major (Ionian) · 1 oct")).toBeInTheDocument();
    expect(screen.getByTestId("scale-run-notes")).toBeInTheDocument();
    // Up-and-down over one octave: 8 up + 7 back down.
    expect(screen.getByTestId("scale-run-notes").children).toHaveLength(15);
  });

  it("pushes its run to the runtime when it owns the targets", () => {
    const setTargets = vi.fn();
    render(
      <DrillRuntimeProvider value={createRuntime("scaleRunner", { setTargets })}>
        <ScaleRunnerBlock {...scaleRunnerDefaultConfig} />
      </DrillRuntimeProvider>
    );

    expect(setTargets).toHaveBeenCalledTimes(1);
    expect(setTargets.mock.calls[0][0]).toHaveLength(15);
  });

  it("explains itself instead of fighting when another block owns the page", () => {
    const setTargets = vi.fn();
    render(
      <DrillRuntimeProvider value={createRuntime("chordSet", { setTargets })}>
        <ScaleRunnerBlock {...scaleRunnerDefaultConfig} />
      </DrillRuntimeProvider>
    );

    expect(setTargets).not.toHaveBeenCalled();
    expect(screen.getByText(/already owns this page/i)).toBeInTheDocument();
  });

  it("renders a static placeholder with no runtime at all", () => {
    render(<ScaleRunnerBlock {...scaleRunnerDefaultConfig} />);
    expect(screen.getByText("Scale run")).toBeInTheDocument();
  });
});

describe("RootCycleBlock", () => {
  it("shows the shape and the cycle order", () => {
    render(
      <DrillRuntimeProvider value={createRuntime("rootCycle")}>
        <RootCycleBlock {...rootCycleDefaultConfig} />
      </DrillRuntimeProvider>
    );

    expect(
      screen.getByText("maj7 · Circle of fourths (C F Bb…)")
    ).toBeInTheDocument();
  });

  it("sends twelve keys to the runtime", () => {
    const setTargets = vi.fn();
    render(
      <DrillRuntimeProvider value={createRuntime("rootCycle", { setTargets })}>
        <RootCycleBlock {...rootCycleDefaultConfig} />
      </DrillRuntimeProvider>
    );
    expect(setTargets.mock.calls[0][0]).toHaveLength(12);
  });

  it("skips the current target on request", () => {
    const skipTarget = vi.fn();
    render(
      <DrillRuntimeProvider value={createRuntime("rootCycle", { skipTarget })}>
        <RootCycleBlock {...rootCycleDefaultConfig} />
      </DrillRuntimeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(skipTarget).toHaveBeenCalled();
  });
});

describe("ProgressionBlock", () => {
  it("shows the progression and key", () => {
    render(
      <DrillRuntimeProvider value={createRuntime("progression")}>
        <ProgressionBlock {...progressionDefaultConfig} />
      </DrillRuntimeProvider>
    );
    expect(screen.getByText("ii7 V7 Imaj7 · key of C")).toBeInTheDocument();
  });

  it("names the key cycle when running through every key", () => {
    render(
      <DrillRuntimeProvider value={createRuntime("progression")}>
        <ProgressionBlock {...progressionDefaultConfig} cycleKeys />
      </DrillRuntimeProvider>
    );
    expect(
      screen.getByText("ii7 V7 Imaj7 · Circle of fourths (C F Bb…)")
    ).toBeInTheDocument();
  });

  it("surfaces roman numerals it could not parse", () => {
    render(
      <DrillRuntimeProvider value={createRuntime("progression")}>
        <ProgressionBlock
          {...progressionDefaultConfig}
          source="custom"
          customText="I V zzz"
        />
      </DrillRuntimeProvider>
    );
    expect(screen.getByRole("status")).toHaveTextContent("zzz");
  });

  it("tells the user where to look when nothing parses", () => {
    render(
      <DrillRuntimeProvider
        value={createRuntime("progression", { currentTarget: null })}
      >
        <ProgressionBlock
          {...progressionDefaultConfig}
          source="custom"
          customText="qqq"
        />
      </DrillRuntimeProvider>
    );
    expect(
      screen.getByText(/check the roman numerals in settings/i)
    ).toBeInTheDocument();
  });
});
