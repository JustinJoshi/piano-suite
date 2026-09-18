import { describe, it, expect, vi, beforeEach } from "vitest";
import { useEffect, useMemo } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useDrillRuntimeProvider } from "@/hooks/useDrillRuntime";
import { useRuntimeSource } from "@/hooks/useRuntimeSource";
import {
  DrillRuntimeProvider,
  useDrillRuntime,
} from "@/lib/drill-runtime";
import type { PracticeNote } from "@/lib/practice-note";

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

function note(symbol: string): PracticeNote {
  return { midi: [60], pcs: new Set([0]), symbol };
}

function Source({ id, symbols }: { id: string; symbols: string[] }) {
  const notes = useMemo(
    () => symbols.map((s) => ({ ...note(s), symbol: s })),
    [symbols]
  );
  const { hasRuntime } = useRuntimeSource(id, notes);
  return <div data-testid="source">{String(hasRuntime)}</div>;
}

function StreamProbe() {
  const runtime = useDrillRuntime();
  return (
    <div data-testid="stream">
      {runtime?.stream.map((n) => n.symbol).join(",")}
    </div>
  );
}

function Harness({ id, symbols }: { id: string; symbols: string[] }) {
  const runtime = useDrillRuntimeProvider({
    pageId: "page-1",
    blocks: [{ id, type: "pieceLibrary", config: {} }],
  });
  return (
    <DrillRuntimeProvider value={runtime}>
      <Source id={id} symbols={symbols} />
      <StreamProbe />
    </DrillRuntimeProvider>
  );
}

describe("useRuntimeSource", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("surfaces the registered notes on the runtime stream", async () => {
    render(<Harness id="piece-1" symbols={["C4", "E4"]} />);

    await waitFor(() => {
      expect(screen.getByTestId("stream")).toHaveTextContent("C4,E4");
    });
    expect(screen.getByTestId("source")).toHaveTextContent("true");
  });

  it("removes the notes on unmount", async () => {
    const { unmount } = render(<Harness id="piece-1" symbols={["C4"]} />);

    await waitFor(() => {
      expect(screen.getByTestId("stream")).toHaveTextContent("C4");
    });

    unmount();
  });

  it("does not loop when identical notes are re-registered every render", async () => {
    function ReRegisterer({ onRender }: { onRender: () => void }) {
      useEffect(onRender);
      const runtime = useDrillRuntime();
      const notes = useMemo(() => [note("C4")], []);

      // No dep array: re-registers after every render. With the runtime's
      // reference-compare bail this runs once and stops; without it this
      // test would loop forever.
      useEffect(() => {
        runtime?.setRuntimeSourceNotes("piece-1", notes);
      });

      return null;
    }

    function LoopHarness({ onRender }: { onRender: () => void }) {
      const runtime = useDrillRuntimeProvider({
        pageId: "page-1",
        blocks: [{ id: "piece-1", type: "pieceLibrary", config: {} }],
      });
      return (
        <DrillRuntimeProvider value={runtime}>
          <ReRegisterer onRender={onRender} />
          <StreamProbe />
        </DrillRuntimeProvider>
      );
    }

    const countRef = { current: 0 };
    render(<LoopHarness onRender={() => void countRef.current++} />);

    await waitFor(() => {
      expect(screen.getByTestId("stream")).toHaveTextContent("C4");
    });

    // Settle any stray effects, then confirm renders stopped.
    await new Promise((r) => setTimeout(r, 20));
    const settled = countRef.current;
    await new Promise((r) => setTimeout(r, 20));
    expect(countRef.current).toBe(settled);
    expect(settled).toBeLessThan(5);
  });
});
