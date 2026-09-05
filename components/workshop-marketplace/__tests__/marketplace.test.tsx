import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { Marketplace } from "@/components/workshop-marketplace/marketplace";
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

// The twenty registered blocks, pinned by type (matches the manifests).
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

const SECONDARY_TYPES = ["chordLibrary", "scaleLibrary", "pieceLibrary", "rhythmPattern"];

function blockOf(type: string): FeatureBlock {
  return { id: `id-${type}`, type, version: 1, config: {} };
}

function renderMarketplace(
  blocks: FeatureBlock[] = [],
  onAdd = vi.fn(),
  onRemove = vi.fn()
) {
  return render(
    <AudioSettingsProvider>
      <Marketplace
        pageBlocks={blocks}
        onAddBlock={onAdd}
        onRemoveBlockType={onRemove}
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

describe("Marketplace", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the two tiers: 16 interactive cards and 4 quiet rows", () => {
    renderMarketplace();

    // Interactive tier: exactly the 16 interactive cards.
    const cardIds = INTERACTIVE_TYPES.map((type) => `marketplace-card-${type}`);
    expect(screen.queryAllByTestId(/marketplace-card-/).map((el) => el.getAttribute("data-testid"))).toEqual(
      expect.arrayContaining(cardIds)
    );
    expect(screen.getAllByTestId(/marketplace-card-/)).toHaveLength(16);

    // Secondary tier: collapsed until expanded, then exactly 4 rows.
    expect(screen.queryByTestId("marketplace-row-chordLibrary")).not.toBeInTheDocument();
    expandSecondarySection();
    const rowIds = SECONDARY_TYPES.map((type) => `marketplace-row-${type}`);
    expect(screen.queryAllByTestId(/marketplace-row-/).map((el) => el.getAttribute("data-testid"))).toEqual(
      expect.arrayContaining(rowIds)
    );
    expect(screen.getAllByTestId(/marketplace-row-/)).toHaveLength(4);
  });

  it("mounts 16 live previews (cards only) and no secondary previews", () => {
    const { container } = renderMarketplace();

    // One live preview per interactive card, none for the rows.
    const previewWrappers = container.querySelectorAll("[data-testid^='marketplace-preview-']");
    expect(previewWrappers).toHaveLength(16);
    expect(
      container.querySelector("[data-testid='marketplace-preview-chordLibrary']")
    ).toBeNull();

    // Previews are real: the metronome renders its actual UI at 120 BPM.
    expect(screen.getByTestId("bpm-display")).toHaveTextContent("120 BPM");
    // MIDI connection bar renders its real UI (unsupported banner in jsdom).
    expect(screen.getByText(/Web MIDI is not supported/i)).toBeInTheDocument();
    // Drill timer + chord set render via the preview runtime.
    expect(screen.getByText("Press start to begin")).toBeInTheDocument();
    expect(screen.getByText("Chord target")).toBeInTheDocument();
    // Text block renders default instructions.
    expect(screen.getByText(/Enter your practice instructions/i)).toBeInTheDocument();

    // The Chord library preview must not be mounted while its panel is closed.
    expect(screen.queryByTestId("chord-stream")).not.toBeInTheDocument();

    expandSecondarySection();
    // Rows still render no preview surface.
    expect(screen.queryByTestId("chord-stream")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scale-stream")).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId("marketplace-row-chordLibrary")).queryByTestId(
        /^marketplace-preview-/
      )
    ).not.toBeInTheDocument();
  });

  it("adds a component with the plus button", () => {
    const onAdd = vi.fn();
    renderMarketplace([], onAdd);

    fireEvent.click(screen.getByRole("button", { name: /add metronome/i }));
    expect(onAdd).toHaveBeenCalledWith("metronome");
  });

  it("adds a supplementary component from its row", () => {
    const onAdd = vi.fn();
    renderMarketplace([], onAdd);
    expandSecondarySection();

    const row = screen.getByTestId("marketplace-row-chordLibrary");
    fireEvent.click(within(row).getByRole("button", { name: /add chord library/i }));
    expect(onAdd).toHaveBeenCalledWith("chordLibrary");
  });

  it("shows an added state for types already on the page and removes on click", () => {
    const onRemove = vi.fn();
    renderMarketplace([blockOf("metronome")], vi.fn(), onRemove);

    const added = screen.getByRole("button", { name: /metronome added/i });
    expect(added).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(added);
    expect(onRemove).toHaveBeenCalledWith("metronome");
  });

  it("keeps the plus state for types not on the page", () => {
    renderMarketplace([blockOf("textBlock")]);

    expect(
      screen.getByRole("button", { name: /add metronome/i })
    ).toHaveAttribute("aria-pressed", "false");
  });
});
