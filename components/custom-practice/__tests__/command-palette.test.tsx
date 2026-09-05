import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { PracticePageEditor } from "@/components/custom-practice/practice-page-editor";
import { AudioSettingsProvider } from "@/hooks/useAudioSettings";
import {
  resetPracticePageStore,
  setPracticePageStore,
  getPracticePageStore,
  createEmptyPracticePage,
  type PracticePageStore,
} from "@/lib/custom-practice-storage";
import { pressVirtualNote } from "@/lib/midi-session";

const { pushMock, useAuthAccessMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  useAuthAccessMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const SIGNED_OUT_AUTH = {
  canPersist: false,
  canAccess: true,
  isSignedIn: false,
} as const;

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: useAuthAccessMock,
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

vi.mock("@/lib/midi-session", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/midi-session")>();
  return {
    ...actual,
    pressVirtualNote: vi.fn(),
    releaseVirtualNote: vi.fn(),
    releaseAllVirtualNotes: vi.fn(),
  };
});

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

function seedStore(...pages: ReturnType<typeof createEmptyPracticePage>[]) {
  const store: PracticePageStore = {
    version: 2,
    pages,
    activePageId: pages[0].id,
  };
  setPracticePageStore(store);
  return store;
}

function renderEditor() {
  return render(
    <AudioSettingsProvider>
      <PracticePageEditor />
    </AudioSettingsProvider>
  );
}

function openPalette() {
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
}

describe("CommandPalette", () => {
  beforeEach(() => {
    resetPracticePageStore();
    pushMock.mockClear();
    useAuthAccessMock.mockReset();
    useAuthAccessMock.mockReturnValue(SIGNED_OUT_AUTH);
    window.localStorage.setItem(
      "piano-suite:starter-picker-dismissed-v1",
      "true"
    );
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
    cleanup();
  });

  it("opens on Ctrl+K and Cmd+K and closes on Escape", () => {
    seedStore(createEmptyPracticePage());
    renderEditor();

    expect(
      screen.queryByRole("dialog", { name: /command palette/i })
    ).not.toBeInTheDocument();

    openPalette();
    expect(
      screen.getByRole("dialog", { name: /command palette/i })
    ).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(
      screen.queryByRole("dialog", { name: /command palette/i })
    ).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(
      screen.getByRole("dialog", { name: /command palette/i })
    ).toBeInTheDocument();
  });

  it("restores focus to the previously focused element on close", () => {
    seedStore(createEmptyPracticePage());
    renderEditor();

    const titleInput = screen.getByLabelText("Practice page title");
    titleInput.focus();
    openPalette();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(document.activeElement).toBe(titleInput);
  });

  it("adds a block by name from the palette", () => {
    const page = createEmptyPracticePage();
    seedStore(page);
    renderEditor();

    openPalette();
    fireEvent.change(screen.getByLabelText("Search commands"), {
      target: { value: "metronome" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /^add metronome/i })
    );

    const blocks = getPracticePageStore().pages[0].blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("metronome");
  });

  it("switches page from the palette", () => {
    const a = createEmptyPracticePage("Warmup");
    const b = createEmptyPracticePage("Scales");
    seedStore(a, b);
    renderEditor();

    openPalette();
    fireEvent.click(screen.getByRole("button", { name: /switch to scales/i }));

    expect(getPracticePageStore().activePageId).toBe(b.id);
  });

  it("opens a tile's settings from the palette", () => {
    const page = createEmptyPracticePage();
    page.blocks = [
      { id: "tile-1", type: "metronome", version: 1, config: { bpm: 120 } },
    ];
    seedStore(page);
    renderEditor();

    openPalette();
    fireEvent.click(
      screen.getByRole("button", { name: /settings for metronome/i })
    );

    expect(screen.getByTestId("tile-settings")).toBeInTheDocument();
  });

  it("focuses a tile from the palette", () => {
    const page = createEmptyPracticePage();
    page.blocks = [
      { id: "tile-1", type: "metronome", version: 1, config: { bpm: 120 } },
    ];
    seedStore(page);
    renderEditor();

    openPalette();
    fireEvent.click(screen.getByRole("button", { name: /^focus metronome/i }));

    expect(document.activeElement).toHaveAttribute("data-tile-id", "tile-1");
  });

  it("opens the block library from the palette", async () => {
    seedStore(createEmptyPracticePage());
    renderEditor();

    openPalette();
    fireEvent.click(
      screen.getByRole("button", { name: /open block library/i })
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/tools/workshop/blocks");
    });
  });

  it("does not open from an editable target", () => {
    const page = createEmptyPracticePage();
    page.blocks = [
      { id: "tile-1", type: "metronome", version: 1, config: { bpm: 120 } },
    ];
    seedStore(page);
    renderEditor();

    fireEvent.click(screen.getByLabelText("Tile settings"));
    const widthRange = screen.getByLabelText("Width");
    widthRange.focus();

    fireEvent.keyDown(widthRange, { key: "k", ctrlKey: true });

    expect(
      screen.queryByRole("dialog", { name: /command palette/i })
    ).not.toBeInTheDocument();
  });

  it("keeps the / shortcut working and never plays a note across the whole sequence", () => {
    const page = createEmptyPracticePage();
    page.blocks = [
      { id: "tile-1", type: "metronome", version: 1, config: { bpm: 120 } },
    ];
    seedStore(page);
    renderEditor();

    // Full keyboard session: palette, add, settings, focus, library.
    openPalette();
    fireEvent.change(screen.getByLabelText("Search commands"), {
      target: { value: "text" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add instructions/i }));
    openPalette();
    fireEvent.click(
      screen.getByRole("button", { name: /settings for metronome/i })
    );
    openPalette();
    fireEvent.click(screen.getByRole("button", { name: /^focus metronome/i }));
    openPalette();
    fireEvent.click(
      screen.getByRole("button", { name: /open block library/i })
    );
    fireEvent.keyDown(window, { key: "/" });

    expect(pushMock).toHaveBeenCalledWith("/tools/workshop/blocks");
    expect(vi.mocked(pressVirtualNote)).not.toHaveBeenCalled();
  });
  it("opens shortcut help with ? and closes it with Escape", () => {
    seedStore(createEmptyPracticePage());
    renderEditor();

    fireEvent.keyDown(window, { key: "?" });
    expect(
      screen.getByRole("dialog", { name: /keyboard shortcuts/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Ctrl/Cmd+K")).toBeInTheDocument();
    expect(screen.getByText("Open the block library")).toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByRole("dialog", { name: /keyboard shortcuts/i }),
      { key: "Escape" }
    );
    expect(
      screen.queryByRole("dialog", { name: /keyboard shortcuts/i })
    ).not.toBeInTheDocument();
  });
});
