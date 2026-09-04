import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TargetDisplayBlock } from "@/components/feature-blocks/target-display-block";
import { ChordLibraryBlock } from "@/components/feature-blocks/chord-library-block";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import { targetDisplayDefaultConfig } from "@/lib/feature-blocks/target-display/config";

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

function page(blocks: object[]) {
  return blocks as Array<{ id: string; type: string; config: unknown }>;
}

describe("TargetDisplayBlock", () => {
  it("renders the sibling chord library's chords, not preview fixtures", () => {
    render(
      <DrillRuntimeProvider
        pageId="page-1"
        blocks={page([
          { id: "b1", type: "chordLibrary", config: { chords: "G7, Dm7" } },
          { id: "b2", type: "targetDisplay", config: {} },
        ])}
      >
        <ChordLibraryBlock chords="G7, Dm7" />
        <TargetDisplayBlock {...targetDisplayDefaultConfig} />
      </DrillRuntimeProvider>
    );

    // Stream content from the library source: G7 shows in the library's own
    // tile and in the display's Current panel.
    expect(screen.getAllByText("G7").length).toBeGreaterThanOrEqual(1);
    // ...and none of the old preview symbols.
    expect(screen.queryByText("C major")).not.toBeInTheDocument();
    expect(screen.queryByText("C minor")).not.toBeInTheDocument();
    expect(screen.queryByText("Cmaj7")).not.toBeInTheDocument();
    expect(screen.queryByText("Cm7")).not.toBeInTheDocument();

    // Position line proves the stream length comes from the library too.
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
  });

  it("shows the empty state when no source feeds the page", () => {
    render(
      <DrillRuntimeProvider pageId="page-1" blocks={page([])}>
        <TargetDisplayBlock {...targetDisplayDefaultConfig} />
      </DrillRuntimeProvider>
    );

    expect(
      screen.getByText(/Target display \(connect a source\)/)
    ).toBeInTheDocument();
  });
});
