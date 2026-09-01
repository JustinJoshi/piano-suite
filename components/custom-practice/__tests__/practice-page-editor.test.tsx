import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PracticePageEditor } from "@/components/custom-practice/practice-page-editor";
import { AudioSettingsProvider } from "@/hooks/useAudioSettings";
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
    settings: { getSetting: {}, setSetting: {} },
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

  it("shows the starter picker on first run and builds a page from a template", () => {
    seedWithPage();
    window.localStorage.removeItem("piano-suite:starter-picker-dismissed-v1");

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    expect(screen.getByText("How do you want to start?")).toBeInTheDocument();
    expect(screen.getByText("Guided routes")).toBeInTheDocument();
    expect(
      screen.getByTestId("picker-route-music-theory")
    ).toHaveAttribute("href", "/routes/music-theory");
    expect(screen.queryByTestId("workshop-grid")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /First chords/i }));

    const stored = getPracticePageStore().pages[0];
    expect(stored.blocks.length).toBeGreaterThan(0);
    expect(screen.getByTestId("workshop-grid")).toBeInTheDocument();
  });

  it("dismisses the starter picker into a blank grid and reopens it from the pages menu", () => {
    seedWithPage();
    window.localStorage.removeItem("piano-suite:starter-picker-dismissed-v1");

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /start from scratch/i }));
    expect(screen.getByTestId("workshop-grid")).toBeInTheDocument();
    expect(screen.getByTestId("workshop-grid").getAttribute("data-grid-empty")).toBe("true");

    openPagesMenu();
    fireEvent.click(screen.getByRole("button", { name: /templates/i }));
    expect(screen.getByText("How do you want to start?")).toBeInTheDocument();
  });

  it("seeds a ready-made drills tile into a fresh page", () => {
    setPracticePageStore(createEmptyPracticePageStore());

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    const grid = screen.getByTestId("workshop-grid");
    expect(grid.getAttribute("data-grid-empty")).toBeNull();

    const tile = grid.querySelector("[data-workshop-tile]");
    expect(tile).not.toBeNull();
    expect(tile?.querySelector('a[href="/tools/chord-drill"]')).not.toBeNull();

    const stored = getPracticePageStore().pages[0].blocks[0];
    expect(stored.type).toBe("drillShortcuts");
  });

  it("treats a fresh starter page as blank for the template picker", () => {
    setPracticePageStore(createEmptyPracticePageStore());
    window.localStorage.removeItem("piano-suite:starter-picker-dismissed-v1");

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    expect(screen.getByText("How do you want to start?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /First chords/i }));

    // The template replaces the fresh starter page in place.
    const store = getPracticePageStore();
    expect(store.pages).toHaveLength(1);
    expect(store.pages[0].blocks.some((b) => b.type === "chordSet")).toBe(true);
  });

  it("stretches the grid across the whole workshop page", () => {
    seedWithPage();

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    const grid = screen.getByTestId("workshop-grid");
    expect(grid.getAttribute("data-grid-full")).toBe("true");
    expect(grid.className).toContain("flex-1");
  });

  it("renders a blank grid with guides when the page is empty", () => {
    seedWithPage();

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    const grid = screen.getByTestId("workshop-grid");
    expect(grid.getAttribute("data-grid-empty")).toBe("true");
    expect(screen.getAllByTestId("grid-guide")).toHaveLength(4);
    expect(
      screen.getByRole("link", { name: /open the block library/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add feature/i })
    ).not.toBeInTheDocument();
  });

  it("links the header block-library button to the blocks route", () => {
    seedWithPage();
    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    expect(
      screen.getByRole("link", { name: /open the block library/i })
    ).toHaveAttribute("href", "/tools/workshop/blocks");
  });

  it("opens the block library with the / shortcut", () => {
    seedWithPage();
    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    fireEvent.keyDown(window, { key: "/" });
    expect(pushMock).toHaveBeenCalledWith("/tools/workshop/blocks");
  });

  it("does not open the block library with / when an input is focused", () => {
    seedWithPage();
    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    const titleInput = screen.getByPlaceholderText("Untitled practice page");
    fireEvent.keyDown(titleInput, { key: "/" });

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("renders blocks inside the workshop grid", () => {
    seedWithBlock();

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    expect(screen.getByTestId("workshop-grid")).toBeInTheDocument();
    expect(screen.getByTestId("bpm-display")).toBeInTheDocument();
  });

  it("persists a resized tile back to the store", () => {
    seedWithBlock();

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

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

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    fireEvent.click(screen.getByLabelText("Duplicate"));

    return waitFor(() => {
      expect(screen.getAllByTestId("bpm-display")).toHaveLength(2);
    });
  });

  it("removes a block from the tile toolbar", () => {
    seedWithBlock();

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    fireEvent.click(screen.getByLabelText("Remove"));

    return waitFor(() => {
      expect(screen.queryByTestId("bpm-display")).not.toBeInTheDocument();
    });
  });

  it("creates a new page from the pages menu and switches between pages", () => {
    const first = seedWithBlock();

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

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

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

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

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    openPagesMenu();
    fireEvent.click(screen.getByRole("button", { name: /delete page/i }));

    const store = getPracticePageStore();
    expect(store.pages).toHaveLength(1);
    expect(store.pages[0].id).toBe(a.id);
  });

  it("opens the share panel from the pages menu", () => {
    seedWithPage();

    render(
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    );

    expect(screen.queryByText(/Upgrade to Pro to publish/i)).not.toBeInTheDocument();

    openPagesMenu();
    fireEvent.click(screen.getByRole("button", { name: /share page/i }));

    expect(screen.getByText(/Upgrade to Pro to publish/i)).toBeInTheDocument();
  });
});
