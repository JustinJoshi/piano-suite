import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMemo } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useDrillRuntimeProvider } from "@/hooks/useDrillRuntime";
import { useTargetSource } from "@/hooks/useTargetSource";
import {
  DrillRuntimeProvider,
  useDrillRuntime,
  type ChordTarget,
} from "@/lib/drill-runtime";

vi.mock("@/hooks/useDrillTimer", () => ({
  useDrillTimer: vi.fn(() => ({
    phase: "idle",
    liveMs: 0,
    countdownValue: 0,
    breakRemaining: 0,
    start: vi.fn(),
    markSuccess: vi.fn(),
    nextRep: vi.fn(),
    finishRound: vi.fn(),
    cancel: vi.fn(),
  })),
}));

vi.mock("@/hooks/useMidi", () => ({
  useMidi: vi.fn(() => ({ heldPcs: new Set<number>() })),
}));

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: vi.fn(() => ({ canPersist: false })),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    tracking: {
      logPracticeEvent: { __mutation: "logPracticeEvent" },
      logMissEvent: { __mutation: "logMissEvent" },
    },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn(() => Promise.resolve("id"))),
}));

function targetFor(ownerKey: string): ChordTarget {
  return {
    id: `${ownerKey}-target`,
    symbol: `${ownerKey}-symbol`,
    notes: ["C"],
    pcs: new Set([0]),
  };
}

function Source({ ownerKey }: { ownerKey: string }) {
  const targets = useMemo(() => [targetFor(ownerKey)], [ownerKey]);
  const state = useTargetSource(ownerKey, targets);

  return (
    <div data-testid={`source-${ownerKey}`}>
      {state.isActive ? "active" : state.isSuperseded ? "superseded" : "idle"}
    </div>
  );
}

function CurrentTarget() {
  const runtime = useDrillRuntime();
  return <div data-testid="current">{runtime?.currentTarget?.symbol ?? "none"}</div>;
}

function Harness({ owners }: { owners: string[] }) {
  const runtime = useDrillRuntimeProvider({ pageId: "page-1" });
  return (
    <DrillRuntimeProvider value={runtime}>
      {owners.map((owner) => (
        <Source key={owner} ownerKey={owner} />
      ))}
      <CurrentTarget />
    </DrillRuntimeProvider>
  );
}

describe("useTargetSource", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("makes a lone target block active", async () => {
    render(<Harness owners={["chordSet"]} />);

    await waitFor(() => {
      expect(screen.getByTestId("source-chordSet")).toHaveTextContent("active");
    });
    expect(screen.getByTestId("current")).toHaveTextContent("chordSet-symbol");
  });

  it("gives the first registered block the targets and supersedes the rest", async () => {
    render(<Harness owners={["chordSet", "scaleRunner"]} />);

    await waitFor(() => {
      expect(screen.getByTestId("source-chordSet")).toHaveTextContent("active");
    });
    expect(screen.getByTestId("source-scaleRunner")).toHaveTextContent(
      "superseded"
    );
    // The superseded block must not overwrite the owner's targets.
    expect(screen.getByTestId("current")).toHaveTextContent("chordSet-symbol");
  });

  it("hands ownership to the next block when the owner unmounts", async () => {
    const { rerender } = render(
      <Harness owners={["chordSet", "scaleRunner"]} />
    );

    await waitFor(() => {
      expect(screen.getByTestId("source-chordSet")).toHaveTextContent("active");
    });

    rerender(<Harness owners={["scaleRunner"]} />);

    await waitFor(() => {
      expect(screen.getByTestId("source-scaleRunner")).toHaveTextContent(
        "active"
      );
    });
    expect(screen.getByTestId("current")).toHaveTextContent("scaleRunner-symbol");
  });

  it("reports no runtime outside a provider", () => {
    function Bare() {
      const state = useTargetSource("chordSet", []);
      return (
        <div data-testid="bare">
          {String(state.hasRuntime)}:{String(state.isActive)}:
          {String(state.isSuperseded)}
        </div>
      );
    }

    render(<Bare />);
    expect(screen.getByTestId("bare")).toHaveTextContent("false:false:false");
  });
});
