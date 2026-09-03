import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
  vi.unstubAllGlobals();
});

function visibleNoteCount(): number {
  return screen.queryAllByTestId("note-roll-note").length;
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
});
