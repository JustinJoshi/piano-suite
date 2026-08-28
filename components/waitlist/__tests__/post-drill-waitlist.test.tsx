import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PostDrillWaitlist } from "@/components/waitlist/post-drill-waitlist";
import { DrillRuntimeProvider } from "@/lib/drill-runtime";
import type { DrillRuntime } from "@/lib/drill-runtime";

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn().mockResolvedValue({ status: "joined", position: 1 })),
}));

function runtimeStub(phase: DrillRuntime["phase"]): DrillRuntime {
  return {
    phase,
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
  };
}

describe("PostDrillWaitlist", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders nothing outside the finished phase", () => {
    render(
      <DrillRuntimeProvider value={runtimeStub("timing")}>
        <PostDrillWaitlist />
      </DrillRuntimeProvider>
    );

    expect(screen.queryByText(/founding pro/i)).not.toBeInTheDocument();
  });

  it("renders the waitlist CTA once a drill finishes", () => {
    render(
      <DrillRuntimeProvider value={runtimeStub("finished")}>
        <PostDrillWaitlist />
      </DrillRuntimeProvider>
    );

    expect(screen.getByText(/founding pro/i)).toBeInTheDocument();
  });

  it("stays hidden after dismissal for the session", () => {
    render(
      <DrillRuntimeProvider value={runtimeStub("finished")}>
        <PostDrillWaitlist />
      </DrillRuntimeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss|later/i }));

    expect(screen.queryByText(/founding pro/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem("waitlist.postDrillDismissed")).toBe(
      "true"
    );
  });
});
