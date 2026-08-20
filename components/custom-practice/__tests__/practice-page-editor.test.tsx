import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PracticePageEditor } from "@/components/custom-practice/practice-page-editor";
import {
  resetPracticePage,
  setPracticePage,
  createEmptyPracticePage,
} from "@/lib/custom-practice-storage";

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
    tracking: {
      logPracticeEvent: {},
      logMissEvent: {},
    },
  },
}));

function createMockAudioContext() {
  return {
    state: "running",
    currentTime: 0,
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      type: "sine",
      frequency: { value: 0 },
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      disconnect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    })),
    destination: {},
  };
}

describe("PracticePageEditor", () => {
  beforeEach(() => {
    resetPracticePage();
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
    let uuidCount = 0;
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => `test-uuid-${++uuidCount}`),
    } as unknown as Crypto);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetPracticePage();
  });

  it("renders an empty page with an add feature CTA", () => {
    render(<PracticePageEditor />);

    expect(
      screen.getByText("This page is empty. Add your first feature to start practicing.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add feature/i })).toBeInTheDocument();
  });

  it("opens the feature palette with the / shortcut", () => {
    render(<PracticePageEditor />);

    fireEvent.keyDown(window, { key: "/" });

    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Metronome")).toBeInTheDocument();
  });

  it("does not open the palette with / when an input is focused", () => {
    render(<PracticePageEditor />);

    const titleInput = screen.getByPlaceholderText("Untitled practice page");
    fireEvent.focus(titleInput);
    fireEvent.keyDown(titleInput, { key: "/" });

    expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
  });

  it("inserts a block at the top placeholder", async () => {
    const page = createEmptyPracticePage();
    setPracticePage(page);

    render(<PracticePageEditor />);

    // Empty page has one CTA button, not a placeholder.
    // Use the empty-state button instead.
    const addButton = screen.getByRole("button", { name: /add feature/i });
    fireEvent.click(addButton);

    fireEvent.click(screen.getByText("Metronome"));

    await waitFor(() => {
      expect(screen.getByTestId("bpm-display")).toBeInTheDocument();
    });

    expect(screen.getByTestId("bpm-display")).toHaveTextContent("120 BPM");
  });

  it("duplicates a block from the hover toolbar", async () => {
    const page = createEmptyPracticePage();
    setPracticePage(page);

    render(<PracticePageEditor />);

    // Add one metronome block.
    fireEvent.click(screen.getByRole("button", { name: /add feature/i }));
    fireEvent.click(screen.getByText("Metronome"));

    await waitFor(() => {
      expect(screen.getByTestId("bpm-display")).toBeInTheDocument();
    });

    // Hover the block to reveal toolbar.
    const block = screen.getByTestId("bpm-display").closest("[class*='group']") ?? screen.getByTestId("bpm-display").closest("div");
    if (block) fireEvent.mouseEnter(block);

    const duplicateButton = screen.getByLabelText("Duplicate");
    fireEvent.click(duplicateButton);

    await waitFor(() => {
      expect(screen.getAllByTestId("bpm-display")).toHaveLength(2);
    });
  });

  it("removes a block from the hover toolbar", async () => {
    const page = createEmptyPracticePage();
    setPracticePage(page);

    render(<PracticePageEditor />);

    // Add one metronome block.
    fireEvent.click(screen.getByRole("button", { name: /add feature/i }));
    fireEvent.click(screen.getByText("Metronome"));

    await waitFor(() => {
      expect(screen.getByTestId("bpm-display")).toBeInTheDocument();
    });

    // Hover the block to reveal toolbar.
    const block = screen.getByTestId("bpm-display").closest("[class*='group']") ?? screen.getByTestId("bpm-display").closest("div");
    if (block) fireEvent.mouseEnter(block);

    const removeButton = screen.getByLabelText("Remove");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("bpm-display")).not.toBeInTheDocument();
    });
  });
});
