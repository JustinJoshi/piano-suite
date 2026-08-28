import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PracticePageEditor } from "@/components/custom-practice/practice-page-editor";
import {
  resetPracticePageStore,
  setPracticePageStore,
  getPracticePageStore,
  createEmptyPracticePage,
  createEmptyPracticePageStore,
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
    workshop: {
      listCustomDrills: {},
      upsertCustomDrill: {},
      deleteCustomDrill: {},
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
    resetPracticePageStore();
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
    let uuidCount = 0;
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => `test-uuid-${++uuidCount}`),
    } as unknown as Crypto);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetPracticePageStore();
  });

  function seedWithPage(page = createEmptyPracticePage()) {
    setPracticePageStore({
      ...createEmptyPracticePageStore(),
      pages: [page],
      activePageId: page.id,
    });
    return page;
  }

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

  it("adds a block from the empty-state CTA", async () => {
    seedWithPage();

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

  it("renders blocks inside the workshop grid", async () => {
    seedWithPage();

    render(<PracticePageEditor />);

    fireEvent.click(screen.getByRole("button", { name: /add feature/i }));
    fireEvent.click(screen.getByText("Metronome"));

    await waitFor(() => {
      expect(screen.getByTestId("workshop-grid")).toBeInTheDocument();
    });
    expect(screen.getByTestId("bpm-display")).toBeInTheDocument();
  });

  it("persists a resized tile back to the store", async () => {
    seedWithPage();

    render(<PracticePageEditor />);

    fireEvent.click(screen.getByRole("button", { name: /add feature/i }));
    fireEvent.click(screen.getByText("Metronome"));

    await waitFor(() => {
      expect(screen.getByTestId("workshop-grid")).toBeInTheDocument();
    });

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 160,
      top: 0,
      left: 0,
      bottom: 160,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    fireEvent.pointerDown(screen.getByLabelText("Resize tile"), {
      clientX: 0,
      clientY: 0,
    });
    fireEvent.pointerMove(window, { clientX: 410, clientY: 0 });
    fireEvent.pointerUp(window);

    const stored = getPracticePageStore().pages[0].blocks[0];
    expect(stored.size).toEqual({ w: 3, h: 1 });
  });

  it("duplicates a block from the hover toolbar", async () => {
    seedWithPage();

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
    seedWithPage();

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

  it("creates a new page from the switcher and switches between pages", async () => {
    const first = seedWithPage(
      createEmptyPracticePage("Warmup")
    );

    render(<PracticePageEditor />);

    // Rename happens via the title input; add a block to the first page so
    // the two pages are visibly different.
    fireEvent.click(screen.getByRole("button", { name: /add feature/i }));
    fireEvent.click(screen.getByText("Metronome"));
    await waitFor(() => {
      expect(screen.getByTestId("bpm-display")).toBeInTheDocument();
    });

    // Create a second page.
    fireEvent.click(screen.getByRole("button", { name: /new page/i }));

    await waitFor(() => {
      expect(
        screen.getByText("This page is empty. Add your first feature to start practicing.")
      ).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText(
      "Untitled practice page"
    ) as HTMLInputElement;
    expect(titleInput.value).toBe("My Practice Page");

    // Switch back to the first page via the select.
    const select = screen.getByLabelText("Practice page") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: first.id } });

    await waitFor(() => {
      expect(screen.getByTestId("bpm-display")).toBeInTheDocument();
    });
  });

  it("duplicates the current page from the switcher", async () => {
    const page = seedWithPage(createEmptyPracticePage("Scales"));
    // Give it a block so duplication has something to copy.
    setPracticePageStore({
      version: 2,
      pages: [
        {
          ...page,
          blocks: [
            { id: "block-1", type: "metronome", version: 1, config: { bpm: 120 } },
          ],
        },
      ],
      activePageId: page.id,
    });

    render(<PracticePageEditor />);

    fireEvent.click(screen.getByRole("button", { name: /duplicate page/i }));

    await waitFor(() => {
      const select = screen.getByLabelText(
        "Practice page"
      ) as HTMLSelectElement;
      expect(select.selectedOptions[0]?.textContent).toContain("Scales (copy)");
    });

    expect(screen.getByTestId("bpm-display")).toBeInTheDocument();
  });

  it("deletes the current page after confirmation", () => {
    const a = createEmptyPracticePage("Warmup");
    const b = createEmptyPracticePage("Scales");
    setPracticePageStore({
      version: 2,
      pages: [a, b],
      activePageId: b.id,
    });
    window.confirm = vi.fn(() => true);

    render(<PracticePageEditor />);

    fireEvent.click(screen.getByRole("button", { name: /delete page/i }));

    const select = screen.getByLabelText("Practice page") as HTMLSelectElement;
    expect(select.selectedOptions[0]?.textContent).toContain("Warmup");
    expect(select.options).toHaveLength(1);
  });

  it("disables delete when only one page remains", () => {
    seedWithPage();

    render(<PracticePageEditor />);

    expect(
      screen.getByRole("button", { name: /delete page/i })
    ).toBeDisabled();
  });
});
