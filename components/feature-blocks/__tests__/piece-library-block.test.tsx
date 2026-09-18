import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import { PieceLibraryBlock } from "@/components/feature-blocks/piece-library-block";
import { useNoteStream } from "@/hooks/useNoteStream";
import type { MusicPlayerNote } from "@/lib/music-player";

// `parseMidiFile` is mocked at the module boundary: constructing a byte-level
// synthetic MIDI buffer in the test adds parser-coupling without testing the
// parser (which has its own coverage). No real piece is ever downloaded.
vi.mock("@/lib/music-player", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/music-player")>();
  return {
    ...actual,
    parseMidiFile: vi.fn(() => {
      const notes: MusicPlayerNote[] = [
        { note: 60, pc: 0, velocity: 100, time: 0, duration: 0.5 },
        { note: 64, pc: 4, velocity: 100, time: 0.5, duration: 0.5 },
        { note: 67, pc: 7, velocity: 100, time: 1, duration: 0.5 },
      ];
      return { kind: "midi" as const, duration: 1.5, notes };
    }),
  };
});

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
  return (
    <div data-testid="stream" data-count={notes.length}>
      {notes.map((n) => n.midi[0]).join(",")}
    </div>
  );
}

function uploadMidi() {
  const input = screen.getByTestId("piece-file-input");
  const file = new File([new Uint8Array([0])], "sonata.mid", {
    type: "audio/midi",
  });
  fireEvent.change(input, { target: { files: [file] } });
}

describe("PieceLibraryBlock runtime source", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("feeds the uploaded piece into the page stream", async () => {
    render(
      <DrillRuntimeProvider
        pageId="page-1"
        blocks={[{ id: "piece-1", type: "pieceLibrary", config: {} }]}
      >
        <PieceLibraryBlock blockId="piece-1" />
        <StreamProbe />
      </DrillRuntimeProvider>
    );

    expect(screen.getByTestId("stream").dataset.count).toBe("0");

    uploadMidi();

    await waitFor(() => {
      expect(screen.getByTestId("piece-summary")).toHaveTextContent(
        "sonata.mid: 3 notes"
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("stream").dataset.count).toBe("3");
    });
    expect(screen.getByTestId("stream")).toHaveTextContent("60,64,67");
    expect(screen.getByTestId("piece-summary")).toHaveTextContent(
      "Playing in the page stream"
    );
  });

  it("renders as today (no stream contribution) outside a runtime", async () => {
    render(<PieceLibraryBlock blockId="piece-1" />);

    uploadMidi();

    await waitFor(() => {
      expect(screen.getByTestId("piece-summary")).toHaveTextContent(
        "sonata.mid: 3 notes"
      );
    });
    expect(screen.getByTestId("piece-summary")).toHaveTextContent(
      "Feed a note roll or target display"
    );
  });
});
