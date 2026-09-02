import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DrillTimerBlock } from "@/components/feature-blocks/drill-timer-block";
import { DrillRuntimeProvider } from "@/lib/drill-runtime";
import type { DrillRuntime } from "@/lib/drill-runtime";

function createRuntime(overrides: Partial<DrillRuntime> = {}): DrillRuntime {
  return {
    pageId: "page-1",
    phase: "idle",
    liveMs: 0,
    countdownValue: 0,
    breakRemaining: 0,
    currentTarget: null,
    targetIndex: 0,
    totalTargets: 0,
    misses: 0,
    start: vi.fn(),
    reset: vi.fn(),
    setTargets: vi.fn(),
    skipTarget: vi.fn(),
    registerTargetSource: vi.fn(() => vi.fn()),
    activeTargetSource: null,
    ...overrides,
  };
}

describe("DrillTimerBlock", () => {
  it("renders idle state with start button", () => {
    render(
      <DrillRuntimeProvider value={createRuntime()}>
        <DrillTimerBlock
          countdownSeconds={3}
          breakSeconds={5}
          multiRep={false}
          showLiveTimer
        />
      </DrillRuntimeProvider>
    );

    expect(screen.getByText("Idle")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("calls start when the start button is clicked", () => {
    const start = vi.fn();
    render(
      <DrillRuntimeProvider value={createRuntime({ start })}>
        <DrillTimerBlock
          countdownSeconds={3}
          breakSeconds={5}
          multiRep={false}
          showLiveTimer
        />
      </DrillRuntimeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    expect(start).toHaveBeenCalled();
  });

  it("renders countdown value", () => {
    render(
      <DrillRuntimeProvider value={createRuntime({ phase: "countdown", countdownValue: 3 })}>
        <DrillTimerBlock
          countdownSeconds={3}
          breakSeconds={5}
          multiRep={false}
          showLiveTimer
        />
      </DrillRuntimeProvider>
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders live timer when timing", () => {
    render(
      <DrillRuntimeProvider value={createRuntime({ phase: "timing", liveMs: 1250 })}>
        <DrillTimerBlock
          countdownSeconds={3}
          breakSeconds={5}
          multiRep={false}
          showLiveTimer
        />
      </DrillRuntimeProvider>
    );

    expect(screen.getByText("1.2s")).toBeInTheDocument();
  });

  it("does not show live timer when disabled", () => {
    render(
      <DrillRuntimeProvider value={createRuntime({ phase: "timing", liveMs: 1250 })}>
        <DrillTimerBlock
          countdownSeconds={3}
          breakSeconds={5}
          multiRep={false}
          showLiveTimer={false}
        />
      </DrillRuntimeProvider>
    );

    expect(screen.queryByText("1.2s")).not.toBeInTheDocument();
  });
});
