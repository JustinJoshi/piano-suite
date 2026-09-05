import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { NoteRollBlock } from "@/components/feature-blocks/note-roll-block";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: vi.fn(() => ({
    canPersist: false,
    canAccess: true,
    isSignedIn: false,
  })),
}));

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn()),
  useQuery: vi.fn(() => undefined),
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    tracking: { logPracticeEvent: {}, logMissEvent: {} },
    waitlist: { joinWaitlist: {} },
  },
}));

// Freeze the scroll clock at 0 so the visible-note set is deterministic.
beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn());
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function visibleNoteCount(): number {
  return screen.queryAllByTestId("note-roll-note").length;
}

function stubMatchMedia(matchesReduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches:
        matchesReduce && query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

describe("NoteRollBlock", () => {
  it('shows the preview fixture inside a pageId="" runtime with no blocks', () => {
    render(
      <DrillRuntimeProvider pageId="">
        <NoteRollBlock />
      </DrillRuntimeProvider>
    );

    // The block library has no page context: the fixture roll (four notes)
    // must demo instead of an unexplained blank.
    expect(visibleNoteCount()).toBeGreaterThan(0);
    expect(screen.queryByText(/connect a source/i)).not.toBeInTheDocument();
  });

  it("shows an empty-state message on a real page with no source", () => {
    render(
      <DrillRuntimeProvider pageId="page-1" blocks={[]}>
        <NoteRollBlock />
      </DrillRuntimeProvider>
    );

    // A real page must not show fixture data pretending to be targets.
    expect(screen.getByText(/connect a source/i)).toBeInTheDocument();
    expect(visibleNoteCount()).toBe(0);
  });

  it("shows the composed stream on a real page with a source block", () => {
    render(
      <DrillRuntimeProvider
        pageId="page-1"
        blocks={[
          {
            id: "b1",
            type: "chordLibrary",
            config: { chords: "Cmaj7, Dm7, G7" },
          },
          { id: "b2", type: "rhythmPattern", config: {} },
        ]}
      >
        <NoteRollBlock />
      </DrillRuntimeProvider>
    );

    // Three timed chords: all inside the lookahead window at t=0.
    expect(visibleNoteCount()).toBe(3);
  });

  it("scrolls the preview roll monotonically across frames", () => {
    // Controllable frame clock, overriding the shared frozen-clock stub:
    // this test needs the loop to actually run.
    let cbs: Array<(t: number) => void> = [];
    let cancels = 0;
    vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => {
      cbs.push(cb);
      return cbs.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {
      cancels++;
    });

    const frame = (t: number) => {
      const pending = cbs;
      cbs = [];
      act(() => {
        pending.forEach((cb) => cb(t));
      });
    };

    render(
      <DrillRuntimeProvider pageId="">
        <NoteRollBlock />
      </DrillRuntimeProvider>
    );

    const firstBottom = (): number =>
      parseFloat(screen.getAllByTestId("note-roll-note")[0].style.bottom);

    // The component's `start === 0` sentinel makes the first delivered
    // frame measure zero elapsed, so drive from frame 1 and sample after
    // every frame.
    const trace: number[] = [];
    for (let i = 1; i <= 8; i++) {
      frame(i * (1000 / 60));
      trace.push(firstBottom());
    }

    // Strictly monotonic — a distinct-values check would pass on the
    // teardown bug, which oscillates between two positions.
    for (let i = 1; i < trace.length; i++) {
      expect(
        trace[i],
        `positions: ${trace.join(" → ")}; effect teardowns: ${cancels}`
      ).toBeGreaterThan(trace[i - 1]);
    }

    // Direct thrash signal: the loop effect must not tear down per frame.
    expect(cancels).toBeLessThanOrEqual(1);
  });

  it("does not start the animation loop when reduced motion is preferred", () => {
    stubMatchMedia(true);
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");

    // Preview runtime so the roll (and its loop) actually render.
    render(
      <DrillRuntimeProvider pageId="">
        <NoteRollBlock />
      </DrillRuntimeProvider>
    );

    expect(screen.getByTestId("note-roll")).toBeInTheDocument();
    expect(rafSpy).not.toHaveBeenCalled();
    rafSpy.mockRestore();
  });

  it("pauses and resumes the loop from the visible control", () => {
    stubMatchMedia(false);
    const rafSpy = vi.spyOn(window, "requestAnimationFrame");

    render(
      <DrillRuntimeProvider pageId="">
        <NoteRollBlock />
      </DrillRuntimeProvider>
    );

    expect(rafSpy).toHaveBeenCalled();

    const pause = screen.getByRole("button", { name: /pause animation/i });
    expect(pause).toHaveAttribute("data-paused", "false");

    fireEvent.click(pause);
    expect(pause).toHaveAttribute("data-paused", "true");
    expect(
      screen.getByRole("button", { name: /resume animation/i })
    ).toHaveAttribute("data-paused", "true");

    fireEvent.click(screen.getByRole("button", { name: /resume animation/i }));
    expect(
      screen.getByRole("button", { name: /pause animation/i })
    ).toHaveAttribute("data-paused", "false");
    rafSpy.mockRestore();
  });
});
