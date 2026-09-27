import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StrictMode } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PracticePageEditor } from "@/components/custom-practice/practice-page-editor";
import { AudioSettingsProvider } from "@/hooks/useAudioSettings";
import {
  resetPracticePageStore,
  setPracticePageStore,
  getPracticePageStore,
  createEmptyPracticePage,
  createEmptyPracticePageStore,
} from "@/lib/custom-practice-storage";

const { pushMock, useAuthAccessMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  useAuthAccessMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

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

type MirroredEvent = {
  name: string;
  props: Record<string, unknown>;
};

function analyticsLog(): MirroredEvent[] {
  return ((window as unknown as Record<string, unknown>).__analyticsEvents ??
    []) as MirroredEvent[];
}

function pageCreations(): MirroredEvent[] {
  return analyticsLog().filter((event) => event.name === "page_created");
}

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

function renderEditor() {
  return render(
    <StrictMode>
      <AudioSettingsProvider>
        <PracticePageEditor />
      </AudioSettingsProvider>
    </StrictMode>
  );
}

describe("PracticePageEditor page_created analytics", () => {
  beforeEach(() => {
    resetPracticePageStore();
    window.localStorage.clear();
    window.localStorage.setItem(
      "piano-suite:starter-picker-dismissed-v1",
      "true"
    );
    delete (window as unknown as Record<string, unknown>).__analyticsEvents;
    pushMock.mockClear();
    useAuthAccessMock.mockReset();
    useAuthAccessMock.mockReturnValue({
      canPersist: false,
      canAccess: true,
      isSignedIn: false,
    });
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
    let uuidCount = 0;
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => `test-uuid-${++uuidCount}`),
    } as unknown as Crypto);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    resetPracticePageStore();
  });

  function seedWithBlock(title = "Warmup") {
    const page = createEmptyPracticePage(title);
    setPracticePageStore({
      version: 2,
      pages: [
        {
          ...page,
          blocks: [{ id: "block-1", type: "metronome", version: 1, config: {} }],
        },
      ],
      activePageId: page.id,
    });
    return page;
  }

  function openPagesMenu() {
    const store = getPracticePageStore();
    const current =
      store.pages.find((p) => p.id === store.activePageId) ?? store.pages[0];
    const title = current.title.trim() || "Untitled";
    fireEvent.click(
      screen.getAllByRole("button", { name: new RegExp(title, "i") })[0]
    );
  }

  it("emits one page_created with origin scratch for a new page", () => {
    seedWithBlock();
    renderEditor();

    openPagesMenu();
    fireEvent.click(screen.getByRole("button", { name: /new page/i }));

    const events = pageCreations();
    expect(events).toHaveLength(1);
    expect(events[0].props).toEqual({ origin: "scratch" });
  });

  it("emits one page_created with origin template when a template is picked", () => {
    setPracticePageStore(createEmptyPracticePageStore());
    window.localStorage.removeItem("piano-suite:starter-picker-dismissed-v1");

    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /First chords/i }));

    const events = pageCreations();
    expect(events).toHaveLength(1);
    expect(events[0].props).toEqual({
      origin: "template",
      templateId: "first-chords",
    });
  });

  it("emits one creation event when a starter shell is replaced in place", () => {
    setPracticePageStore(createEmptyPracticePageStore());
    window.localStorage.removeItem("piano-suite:starter-picker-dismissed-v1");

    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: /First chords/i }));

    const store = getPracticePageStore();
    expect(store.pages).toHaveLength(1);
    expect(store.pages[0].blocks.some((b) => b.type === "chordSet")).toBe(true);
    expect(pageCreations()).toHaveLength(1);
  });

  it("emits one page_created with origin duplicate when the page is duplicated", () => {
    seedWithBlock();
    renderEditor();

    openPagesMenu();
    fireEvent.click(screen.getByRole("button", { name: /duplicate page/i }));

    const events = pageCreations();
    expect(events).toHaveLength(1);
    expect(events[0].props).toEqual({ origin: "duplicate" });

    const store = getPracticePageStore();
    expect(store.pages).toHaveLength(2);
    expect(store.activePageId).toBe(store.pages[1].id);
    expect(store.pages[1].blocks[0].id).not.toBe("block-1");
  });

  it("emits nothing on rerender, remount or plain page selection", () => {
    const first = seedWithBlock("Warmup");
    const second = createEmptyPracticePage("Scales");
    setPracticePageStore({
      version: 2,
      pages: [
        { ...first, blocks: [{ id: "block-1", type: "metronome", version: 1, config: {} }] },
        second,
      ],
      activePageId: first.id,
    });

    const view = renderEditor();
    delete (window as unknown as Record<string, unknown>).__analyticsEvents;

    view.rerender(
      <StrictMode>
        <AudioSettingsProvider>
          <PracticePageEditor />
        </AudioSettingsProvider>
      </StrictMode>
    );
    view.unmount();
    renderEditor();

    openPagesMenu();
    fireEvent.click(
      screen.getByRole("button", { name: `Switch to ${second.title}` })
    );

    expect(pageCreations()).toHaveLength(0);
  });

  it("never puts page titles or block config into the event payload", () => {
    seedWithBlock("Secret Song Title");
    renderEditor();

    openPagesMenu();
    fireEvent.click(screen.getByRole("button", { name: /duplicate page/i }));

    const events = pageCreations();
    expect(events).toHaveLength(1);
    expect(JSON.stringify(events[0].props)).not.toContain("Secret Song Title");
    expect(JSON.stringify(events[0].props)).not.toContain("bpm");
  });
});
