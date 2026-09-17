import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { PracticePageEditor } from "@/components/custom-practice/practice-page-editor";
import {
  setPracticePageStore,
  resetPracticePageStore,
} from "@/lib/custom-practice-storage";
import type { PracticePage } from "@/lib/feature-blocks/types";
import type { WiringIssue } from "@/lib/feature-blocks/manifest-types";
import { wiringNotice } from "@/components/workshop-grid/workshop-tile";

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
    workshop: {
      listCustomDrills: {},
      upsertCustomDrill: {},
      deleteCustomDrill: {},
    },
    settings: { getSetting: {}, setSetting: {} },
    tracking: { logPracticeEvent: {}, logMissEvent: {} },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
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

// A display with nothing producing practiceNotes: unmet_requirement. The
// validator builds each issue with a structured `requirement` field (the
// plain-language copy maps on it, not on the human-readable `detail`). (A
// rhythmPattern on the same page would satisfy it — the transform's output
// counts — so this page stays alone.)
const UNMET_PAGE: PracticePage = {
  id: "page-unmet",
  title: "Needs a source",
  blocks: [{ id: "roll-1", type: "noteRoll", version: 1, config: {} }],
  updatedAt: 1000,
};

// A transform with no upstream source: orphan_transform.
const ORPHAN_PAGE: PracticePage = {
  id: "page-orphan",
  title: "Needs a source above",
  blocks: [{ id: "xform-2", type: "rhythmPattern", version: 1, config: {} }],
  updatedAt: 1001,
};

// A source plus its transform: fully wired, so the validator must stay quiet.
const WIRED_PAGE: PracticePage = {
  id: "page-wired",
  title: "Wired page",
  blocks: [
    { id: "src-1", type: "chordLibrary", version: 1, config: {} },
    { id: "xform-1", type: "rhythmPattern", version: 1, config: {} },
  ],
  updatedAt: 1002,
};

function seedStore(pages: PracticePage[]) {
  setPracticePageStore({
    version: 2,
    pages,
    activePageId: pages[0].id,
  });
}

function tile(container: HTMLElement, blockId: string): HTMLElement {
  const el = container.querySelector(`[data-tile-id="${blockId}"]`);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`tile ${blockId} not rendered`);
  }
  return el;
}

describe("PracticePageEditor wiring notices", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
    // matches: true pins prefers-reduced-motion so the note roll renders its
    // static frame (no rAF loop in jsdom).
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    resetPracticePageStore();
  });

  afterEach(() => {
    cleanup();
    resetPracticePageStore();
    vi.unstubAllGlobals();
  });

  it("names an unmet requirement in plain language on the block's tile", () => {
    seedStore([UNMET_PAGE]);
    const { container } = render(<PracticePageEditor />);

    const notice = within(tile(container, "roll-1")).getByTestId(
      "tile-wiring-notice"
    );
    expect(notice).toHaveTextContent(
      "Add a source block (like the chord library) so there is something to show here."
    );
  });

  it("names an orphan transform in plain language on the transform's tile", () => {
    seedStore([ORPHAN_PAGE]);
    const { container } = render(<PracticePageEditor />);

    const notice = within(tile(container, "xform-2")).getByTestId(
      "tile-wiring-notice"
    );
    expect(notice).toHaveTextContent(
      "This transform has nothing to transform. Add a source above it."
    );
  });

  it("never renders the raw issue enum to the user", () => {
    seedStore([UNMET_PAGE]);
    const { container } = render(<PracticePageEditor />);

    expect(
      within(container).queryByText(/unmet_requirement|orphan_transform/)
    ).not.toBeInTheDocument();
  });

  it("maps each requirement id to its notice via the structured field", () => {
    const base = { issue: "unmet_requirement" as const };
    expect(
      wiringNotice({ ...base, blockId: "b", type: "t", requirement: "transport", detail: "Requires: transport" })
    ).toBe("Add a transport block to set the tempo for this page.");
    expect(
      wiringNotice({ ...base, blockId: "b", type: "t", requirement: "practiceNotes", detail: "Requires: practiceNotes" })
    ).toBe(
      "Add a source block (like the chord library) so there is something to show here."
    );
    expect(
      wiringNotice({ ...base, blockId: "b", type: "t", requirement: "midiInput", detail: "Requires: midiInput" })
    ).toBe(
      "Connect a MIDI keyboard, or add the on-screen keyboard, so this block can hear notes."
    );
  });

  it("maps a transport requirement to its notice even when detail was reworded", () => {
    // The structured `requirement` field is the coupling, not the
    // human-readable `detail`: rewording the message must not degrade the
    // notice to the generic fallback.
    const issue: WiringIssue = {
      blockId: "clock-1",
      type: "clock",
      issue: "unmet_requirement",
      requirement: "transport",
      detail: "This block would like a tempo set (reworded copy).",
    };
    expect(wiringNotice(issue)).toBe(
      "Add a transport block to set the tempo for this page."
    );
  });

  it("falls back to the generic notice when requirement is absent", () => {
    const issue: WiringIssue = {
      blockId: "clock-1",
      type: "clock",
      issue: "unmet_requirement",
      detail: "Requires: transport",
    };
    expect(wiringNotice(issue)).toBe(
      "This block is missing something it needs to run. Check its settings."
    );
  });

  it("a page with no wiring issues shows no notices", () => {
    seedStore([WIRED_PAGE]);
    const { container } = render(<PracticePageEditor />);

    expect(
      container.querySelectorAll("[data-testid='tile-wiring-notice']")
    ).toHaveLength(0);
    expect(screen.queryByText(/nothing to transform/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Add a source block/)).not.toBeInTheDocument();
  });
});
