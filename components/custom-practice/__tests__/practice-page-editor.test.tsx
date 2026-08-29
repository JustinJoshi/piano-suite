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

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

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
    pushMock.mockClear();
    window.localStorage.setItem("piano-suite:starter-picker-dismissed-v1", "true");
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
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

  function seedWithBlock(config: Record<string, unknown> = { bpm: 120 }) {
    const page = createEmptyPracticePage();
    setPracticePageStore({
      version: 2,
      pages: [
        {
          ...page,
          blocks: [{ id: "block-1", type: "metronome", version: 1, config }],
        },
      ],
      activePageId: page.id,
    });
    return page;
  }

  function openPagesMenu() {
    const current =
      getPracticePageStore().pages.find(
        (p) => p.id === getPracticePageStore().activePageId
      ) ?? getPracticePageStore().pages[0];
    const title = current.title.trim() || "Untitled";
    fireEvent.click(screen.getAllByRole("button", { name: new RegExp(title, "i") })[0]);
  }

  it("renders a blank grid with guides when the page is empty", () => {
    seedWithPage();

    render(<PracticePageEditor />);

    const grid = screen.getByTestId("workshop-grid");
    expect(grid.getAttribute("data-grid-empty")).toBe("true");
    expect(screen.getAllByTestId("grid-guide")).toHaveLength(4);
    expect(
      screen.getByRole("link", { name: /open the marketplace/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add feature/i })
    ).not.toBeInTheDocument();
  });

  it("links the header marketplace button to the marketplace route", () => {
    seedWithPage();
    render(<PracticePageEditor />);

    expect(
      screen.getByRole("link", { name: /open the marketplace/i })
    ).toHaveAttribute("href", "/tools/workshop/marketplace");
  });

  it("opens the marketplace with the / shortcut", () => {
    seedWithPage();
    render(<PracticePageEditor />);

    fireEvent.keyDown(window, { key: "/" });
    expect(pushMock).toHaveBeenCalledWith("/tools/workshop/marketplace");
  });

  it("does not open the marketplace with / when an input is focused", () => {
    seedWithPage();
    render(<PracticePageEditor />);

    const titleInput = screen.getByPlaceholderText("Untitled practice page");
    fireEvent.keyDown(titleInput, { key: "/" });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("renders blocks inside the workshop grid", () => {
    seedWithBlock();

    render(<PracticePageEditor />);

    expect(screen.getByTestId("workshop-grid")).toBeInTheDocument();
    expect(screen.getByTestId("bpm-display")).toBeInTheDocument();
  });

  it("persists a resized tile back to the store", () => {
    seedWithBlock();

    render(<PracticePageEditor />);

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

  it("duplicates a block from the tile toolbar", () => {
    seedWithBlock();

    render(<PracticePageEditor />);

    fireEvent.click(screen.getByLabelText("Duplicate"));

    return waitFor(() => {
      expect(screen.getAllByTestId("bpm-display")).toHaveLength(2);
    });
  });

  it("removes a block from the tile toolbar", () => {
    seedWithBlock();

    render(<PracticePageEditor />);

    fireEvent.click(screen.getByLabelText("Remove"));

    return waitFor(() => {
      expect(screen.queryByTestId("bpm-display")).not.toBeInTheDocument();
    });
  });

  it("creates a new page from the pages menu and switches between pages", () => {
    const first = seedWithBlock();

    render(<PracticePageEditor />);

    openPagesMenu();
    fireEvent.click(screen.getByRole("button", { name: /new page/i }));

    const store = getPracticePageStore();
    expect(store.pages).toHaveLength(2);
    expect(store.pages[1].blocks).toHaveLength(0);

    openPagesMenu();
    fireEvent.click(
      screen.getByRole("button", { name: `Switch to ${first.title}` })
    );
    expect(getPracticePageStore().activePageId).toBe(first.id);
  });

  it("duplicates the current page from the pages menu", () => {
    seedWithBlock();

    render(<PracticePageEditor />);

    openPagesMenu();
    fireEvent.click(screen.getByRole("button", { name: /duplicate page/i }));

    const store = getPracticePageStore();
    expect(store.pages).toHaveLength(2);
    expect(store.pages[1].title).toContain("copy");
    expect(store.pages[1].blocks).toHaveLength(1);
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

    openPagesMenu();
    fireEvent.click(screen.getByRole("button", { name: /delete page/i }));

    const store = getPracticePageStore();
    expect(store.pages).toHaveLength(1);
    expect(store.pages[0].id).toBe(a.id);
  });

  it("opens the share panel from the pages menu", () => {
    seedWithPage();

    render(<PracticePageEditor />);

    expect(screen.queryByText(/Upgrade to Pro to publish/i)).not.toBeInTheDocument();

    openPagesMenu();
    fireEvent.click(screen.getByRole("button", { name: /share page/i }));

    expect(screen.getByText(/Upgrade to Pro to publish/i)).toBeInTheDocument();
  });
});
