import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import { PieceLibraryBlock } from "@/components/feature-blocks/piece-library-block";
import { useNoteStream } from "@/hooks/useNoteStream";
import { parseMidiFile, type MusicPlayerNote } from "@/lib/music-player";

// parseMidiFile is mocked at the module boundary; trackIndex is the phase-1
// addition the assignment UI reads. tonejs Note instances are getter-based,
// so plain objects are used — the parser contract is what matters here.
vi.mock("@/lib/music-player", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/music-player")>();
  return {
    ...actual,
    parseMidiFile: vi.fn(() => defaultParsed()),
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
    <div
      data-testid="stream"
      data-count={notes.length}
      data-hands={notes.map((n) => n.hand ?? "-").join(",")}
    >
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

type RenderOpts = { handFilter?: "both" | "left" | "right" };

function renderBlock({ handFilter }: RenderOpts = {}) {
  return render(
    <DrillRuntimeProvider
      pageId="page-1"
      blocks={[
        {
          id: "piece-1",
          type: "pieceLibrary",
          config: handFilter ? { handFilter } : {},
        },
      ]}
    >
      <PieceLibraryBlock blockId="piece-1" {...(handFilter ? { handFilter } : {})} />
      <StreamProbe />
    </DrillRuntimeProvider>
  );
}

function selectValue(testId: string) {
  return within(screen.getByTestId(testId)).getByRole("option", {
    selected: true,
  }) as HTMLOptionElement;
}

const defaultParsed = () => {
  const notes: MusicPlayerNote[] = [
    { note: 60, pc: 0, velocity: 100, time: 0, duration: 0.5, trackIndex: 0 },
    { note: 64, pc: 4, velocity: 100, time: 0.5, duration: 0.5, trackIndex: 0 },
    { note: 67, pc: 7, velocity: 100, time: 1, duration: 0.5, trackIndex: 1 },
    { note: 72, pc: 0, velocity: 100, time: 1.5, duration: 0.5, trackIndex: 1 },
  ];
  return {
    kind: "midi" as const,
    duration: 2,
    notes,
    tracks: [
      { index: 0, name: "Left hand" },
      { index: 1, name: "Right hand" },
    ],
  };
};

describe("PieceLibraryBlock hand assignment", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(parseMidiFile).mockImplementation(() => defaultParsed());
  });

  it("keeps every note unannotated with no assignment in both mode", async () => {
    renderBlock();
    uploadMidi();

    await waitFor(() => {
      expect(screen.getByTestId("stream").dataset.count).toBe("4");
    });
    expect(screen.getByTestId("stream")).toHaveTextContent("60,64,67,72");
    expect(screen.getByTestId("stream").dataset.hands).toBe("-,-,-,-");
  });

  it("assigns distinct tracks and annotates hands in the stream", async () => {
    renderBlock();
    uploadMidi();

    await screen.findByTestId("left-track-select");

    fireEvent.change(screen.getByTestId("left-track-select"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByTestId("right-track-select"), {
      target: { value: "1" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("stream").dataset.hands).toBe(
        "left,left,right,right"
      );
    });
    expect(selectValue("left-track-select").textContent).toBe("Left hand");
    expect(selectValue("right-track-select").textContent).toBe("Right hand");
  });

  it("filters to the assigned hand when the page hands filter is set", async () => {
    renderBlock({ handFilter: "left" });
    uploadMidi();

    await screen.findByTestId("left-track-select");
    await waitFor(() => {
      expect(screen.getByTestId("stream").dataset.count).toBe("0");
    });
    fireEvent.change(screen.getByTestId("left-track-select"), {
      target: { value: "0" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("stream").dataset.count).toBe("2");
    });
    expect(screen.getByTestId("stream")).toHaveTextContent("60,64");
    expect(screen.getByTestId("stream").dataset.hands).toBe("left,left");

    // Right-hand assignment annotates its track in the page stream; the left
    // filter keeps it out of the filtered stream until the page filter moves.
    fireEvent.change(screen.getByTestId("right-track-select"), {
      target: { value: "1" },
    });
    await waitFor(() => {
      expect(screen.getByTestId("stream").dataset.count).toBe("2");
    });
    expect(screen.getByTestId("stream").dataset.hands).toBe("left,left");
    expect(screen.getByTestId("stream")).toHaveTextContent("60,64");
  });

  it("shows an assignment prompt and an empty stream when the filtered hand has no track", async () => {
    renderBlock({ handFilter: "left" });
    uploadMidi();

    await waitFor(() => {
      expect(screen.getByTestId("stream").dataset.count).toBe("0");
    });
    const prompt = screen.getByTestId("assign-prompt");
    expect(prompt).toHaveTextContent("left hand");
    expect(prompt).toHaveTextContent("no track is assigned to it yet");
    expect(screen.getByTestId("piece-summary")).toHaveTextContent("0 notes");
  });

  it("prevents assigning the same track to both hands without crashing", async () => {
    renderBlock();
    uploadMidi();

    await screen.findByTestId("left-track-select");

    fireEvent.change(screen.getByTestId("left-track-select"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByTestId("right-track-select"), {
      target: { value: "1" },
    });

    // Track 1 is already assigned right; the left option for it is disabled
    // so the conflicting selection cannot be made.
    const leftSelect = screen.getByTestId(
      "left-track-select"
    ) as HTMLSelectElement;
    const conflicting = within(leftSelect).getByRole("option", {
      name: "Right hand",
    }) as HTMLOptionElement;
    expect(conflicting).toBeDisabled();

    // Even if the conflicting value were forced, the stream stays consistent
    // (never a crash): assign right=1 while left=0 stays as-is.
    expect(screen.getByTestId("stream").dataset.hands).toBe("left,left,right,right");
    expect(leftSelect.value).toBe("0");
  });

  it("resets assignment state when a replacement file is uploaded", async () => {
    renderBlock();
    uploadMidi();

    await screen.findByTestId("left-track-select");
    fireEvent.change(screen.getByTestId("left-track-select"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByTestId("right-track-select"), {
      target: { value: "1" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("stream").dataset.hands).toBe(
        "left,left,right,right"
      );
    });

    // Replacement file: same mock, but assignments must not be reused.
    uploadMidi();

    await waitFor(() => {
      expect(screen.getByTestId("stream").dataset.hands).toBe("-,-,-,-");
    });
    expect(
      (screen.getByTestId("left-track-select") as HTMLSelectElement).value
    ).toBe("__none__");
    expect(
      (screen.getByTestId("right-track-select") as HTMLSelectElement).value
    ).toBe("__none__");
  });

  it("shows no selectors for a single-track upload", async () => {
    vi.mocked(parseMidiFile).mockImplementationOnce(() => ({
      kind: "midi" as const,
      duration: 1,
      notes: [
        { note: 60, pc: 0, velocity: 100, time: 0, duration: 1, trackIndex: 0 },
      ],
      tracks: [{ index: 0, name: "Only track" }],
    }));

    renderBlock();
    await screen.findByTestId("piece-file-input");
    uploadMidi();

    await waitFor(() => {
      expect(screen.getByTestId("piece-summary")).toHaveTextContent(
        "1 note"
      );
    });
    // One track cannot be split between hands; selectors stay hidden.
    expect(screen.queryByTestId("left-track-select")).not.toBeInTheDocument();
    expect(screen.queryByTestId("right-track-select")).not.toBeInTheDocument();
    expect(screen.getByTestId("stream").dataset.count).toBe("1");
  });
});
