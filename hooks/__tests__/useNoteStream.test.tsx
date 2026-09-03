import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import { useNoteStream } from "@/hooks/useNoteStream";

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

function StreamProbe() {
  const notes = useNoteStream();
  return <div data-testid="stream">{notes.map((n) => n.symbol).join(",")}</div>;
}

describe("useNoteStream", () => {
  it("returns the page's composed stream inside a DrillRuntimeProvider", () => {
    render(
      <DrillRuntimeProvider
        pageId="page-1"
        blocks={[
          {
            id: "b1",
            type: "chordLibrary",
            config: { chords: "Cmaj7, Dm7, G7" },
          },
        ]}
      >
        <StreamProbe />
      </DrillRuntimeProvider>
    );

    expect(screen.getByTestId("stream")).toHaveTextContent("Cmaj7,Dm7,G7");
  });

  it("returns [] outside a provider", () => {
    render(<StreamProbe />);

    expect(screen.getByTestId("stream").textContent).toBe("");
  });
});
