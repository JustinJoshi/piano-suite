import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { LibrarySections } from "@/components/workshop-marketplace/library-sections";
import { AudioSettingsProvider } from "@/hooks/useAudioSettings";
import type { FeatureBlock } from "@/lib/feature-blocks/types";

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
    settings: { getSetting: {}, setSetting: {} },
    tracking: { logPracticeEvent: {}, logMissEvent: {} },
  },
}));

// Pinned by type to the manifest distribution: 16 interactive cards,
// 3 sources + 1 transform.
const INTERACTIVE_TYPES = [
  "metronome",
  "drillTimer",
  "chordSet",
  "textBlock",
  "midiConnectionBar",
  "drillShortcuts",
  "keyboardDisplay",
  "scaleRunner",
  "rootCycle",
  "progression",
  "sessionStats",
  "restTimer",
  "transport",
  "targetDisplay",
  "noteRoll",
  "freePlay",
];

const SECONDARY_TYPES = [
  "chordLibrary",
  "scaleLibrary",
  "pieceLibrary",
  "rhythmPattern",
];

function blockOf(type: string): FeatureBlock {
  return { id: `id-${type}`, type, version: 1, config: {} };
}

function renderLibrary(pageBlocks: FeatureBlock[] = []) {
  return render(
    <AudioSettingsProvider>
      <LibrarySections
        pageBlocks={pageBlocks}
        onAddBlock={vi.fn()}
        onRemoveBlockType={vi.fn()}
      />
    </AudioSettingsProvider>
  );
}

function expandSecondarySection() {
  fireEvent.click(screen.getByTestId("supplementary-toggle"));
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

describe("LibrarySections", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the full count and keeps the secondary section collapsed by default", () => {
    renderLibrary();

    expect(screen.getByTestId("library-result-count")).toHaveTextContent(
      "Showing all 20 blocks"
    );
    expect(screen.getByTestId("supplementary-toggle")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByTestId("supplementary-list")).not.toBeInTheDocument();
  });

  it("renders exactly the 16 interactive cards with live previews", () => {
    const { container } = renderLibrary();

    const cardTestIds = screen
      .getAllByTestId(/marketplace-card-/)
      .map((el) => el.getAttribute("data-testid"));
    expect(cardTestIds).toHaveLength(16);
    expect(cardTestIds).toEqual(
      expect.arrayContaining(
        INTERACTIVE_TYPES.map((type) => `marketplace-card-${type}`)
      )
    );

    const previewWrappers = container.querySelectorAll(
      "[data-testid^='marketplace-preview-']"
    );
    expect(previewWrappers).toHaveLength(16);
    // One real preview string so a wall of fallbacks would be caught.
    expect(screen.getByTestId("bpm-display")).toHaveTextContent("120 BPM");
  });

  it("renders exactly the 4 supplementary rows without any preview surface", () => {
    const { container } = renderLibrary();
    expandSecondarySection();

    const rowTestIds = screen
      .getAllByTestId(/marketplace-row-/)
      .map((el) => el.getAttribute("data-testid"));
    expect(rowTestIds).toHaveLength(4);
    expect(rowTestIds).toEqual(
      expect.arrayContaining(
        SECONDARY_TYPES.map((type) => `marketplace-row-${type}`)
      )
    );

    // No FeatureRenderer output in the rows: no card previews, and the
    // chord library preview is not mounted anywhere.
    expect(container.querySelectorAll("[data-testid^='marketplace-preview-']")).toHaveLength(16);
    expect(screen.queryByTestId("chord-stream")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scale-stream")).not.toBeInTheDocument();
  });

  it("shows a one-line output sample where one is derivable", () => {
    renderLibrary();
    expandSecondarySection();

    expect(screen.getByTestId("row-sample-chordLibrary")).toHaveTextContent(
      "Cmaj7 · Dm7 · G7"
    );
    expect(screen.getByTestId("row-sample-scaleLibrary")).toHaveTextContent(
      "C · D · E · F · G"
    );
    // Piece library (needs uploaded state) and rhythm pattern (a transform,
    // needs an input) show their summary only — no invented sample.
    expect(
      screen.queryByTestId("row-sample-pieceLibrary")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("row-sample-rhythmPattern")
    ).not.toBeInTheDocument();
  });

  it("marks experimental blocks on cards and rows", () => {
    renderLibrary();
    expandSecondarySection();

    expect(
      within(screen.getByTestId("marketplace-card-noteRoll")).getAllByTestId(
        "experimental-marker"
      )
    ).toHaveLength(1);
    expect(
      within(screen.getByTestId("marketplace-row-chordLibrary")).getByTestId(
        "experimental-marker"
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("marketplace-card-metronome")).queryByTestId(
        "experimental-marker"
      )
    ).not.toBeInTheDocument();
  });

  it("searches by label and summary and auto-expands secondary-only matches", () => {
    const { container } = renderLibrary();

    fireEvent.change(screen.getByTestId("library-search"), {
      target: { value: "rhythm" },
    });

    // Verified against the manifests: only "Rhythm pattern" has "rhythm" in
    // its label or summary — metronome's do not ("Steady beat accompaniment").
    expect(screen.queryByTestId("marketplace-card-metronome")).not.toBeInTheDocument();
    expect(screen.queryByTestId("marketplace-card-drillTimer")).not.toBeInTheDocument();
    expect(screen.getByTestId("marketplace-row-rhythmPattern")).toBeInTheDocument();
    // The match is secondary-only, so the section auto-expanded.
    expect(screen.getByTestId("supplementary-toggle")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(screen.getByTestId("library-result-count")).toHaveTextContent(
      "Showing 1 of 20 blocks"
    );
    expect(container.querySelectorAll("[data-testid^='marketplace-preview-']")).toHaveLength(0);
  });

  it("filters by category", () => {
    const { container } = renderLibrary();

    fireEvent.change(screen.getByTestId("library-category-filter"), {
      target: { value: "rhythm" },
    });
    // Cards still match, so the section is not auto-expanded — open it.
    expandSecondarySection();

    // Category "rhythm": metronome, midi connection, rest timer, transport
    // cards + the rhythm pattern row.
    expect(screen.getByTestId("marketplace-card-metronome")).toBeInTheDocument();
    expect(screen.getByTestId("marketplace-card-midiConnectionBar")).toBeInTheDocument();
    expect(screen.getByTestId("marketplace-card-restTimer")).toBeInTheDocument();
    expect(screen.getByTestId("marketplace-card-transport")).toBeInTheDocument();
    expect(screen.queryByTestId("marketplace-card-drillTimer")).not.toBeInTheDocument();
    expect(screen.getByTestId("marketplace-row-rhythmPattern")).toBeInTheDocument();
    expect(screen.getByTestId("library-result-count")).toHaveTextContent(
      "Showing 5 of 20 blocks"
    );
    expect(container.querySelectorAll("[data-testid^='marketplace-preview-']")).toHaveLength(4);
  });

  it("filters by kind", () => {
    const { container } = renderLibrary();

    fireEvent.change(screen.getByTestId("library-kind-filter"), {
      target: { value: "source" },
    });

    expect(
      screen.queryByTestId("marketplace-card-metronome")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("marketplace-row-chordLibrary")).toBeInTheDocument();
    expect(screen.getByTestId("marketplace-row-scaleLibrary")).toBeInTheDocument();
    expect(screen.getByTestId("marketplace-row-pieceLibrary")).toBeInTheDocument();
    expect(screen.queryByTestId("marketplace-row-rhythmPattern")).not.toBeInTheDocument();
    expect(screen.getByTestId("library-result-count")).toHaveTextContent(
      "Showing 3 of 20 blocks"
    );
    expect(container.querySelectorAll("[data-testid^='marketplace-preview-']")).toHaveLength(0);
  });

  it("names the query in the empty state", () => {
    renderLibrary();

    fireEvent.change(screen.getByTestId("library-search"), {
      target: { value: "zzz-nothing" },
    });

    expect(screen.getByTestId("library-result-count")).toHaveTextContent(
      "No blocks match \"zzz-nothing\""
    );
    expect(
      screen.getByText(/Try a different search or clear the filters/)
    ).toBeInTheDocument();
  });

  it("reports midiInput unmet on an empty page", () => {
    renderLibrary();
    fireEvent.click(screen.getByTestId("about-trigger-midiConnectionBar"));

    const panel = screen.getByTestId("about-panel-midiConnectionBar");
    expect(within(panel).getByLabelText("requirement unsatisfied")).toBeInTheDocument();
  });

  it("reports midiInput satisfied once a note input is on the page", () => {
    renderLibrary([blockOf("keyboardDisplay")]);
    fireEvent.click(screen.getByTestId("about-trigger-midiConnectionBar"));

    const panel = screen.getByTestId("about-panel-midiConnectionBar");
    expect(within(panel).getByLabelText("requirement satisfied")).toBeInTheDocument();
  });
});
