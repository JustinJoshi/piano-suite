import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Marketplace } from "@/components/workshop-marketplace/marketplace";
import { AudioSettingsProvider } from "@/hooks/useAudioSettings";
import { featureRegistry } from "@/lib/feature-blocks/registry";
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

  it("renders a live preview for every registry component", () => {
    renderMarketplace();

    // Metronome renders its real UI.
    expect(screen.getByTestId("bpm-display")).toBeInTheDocument();
    // MIDI connection bar renders its real UI (unsupported banner in jsdom).
    expect(
      screen.getByText(/Web MIDI is not supported/i)
    ).toBeInTheDocument();
    // Drill timer + chord set render via the preview runtime.
    expect(screen.getByText("Press start to begin")).toBeInTheDocument();
    expect(screen.getByText("Chord target")).toBeInTheDocument();
    // Text block renders default instructions.
    expect(
      screen.getByText(/Enter your practice instructions/i)
    ).toBeInTheDocument();

    // One card per registry entry.
    for (const def of Object.values(featureRegistry)) {
      expect(
        screen.getByTestId(`marketplace-card-${def.type}`)
      ).toBeInTheDocument();
    }
  });

  it("adds a component with the plus button", () => {
    const onAdd = vi.fn();
    renderMarketplace([], onAdd);

    fireEvent.click(screen.getByRole("button", { name: /add metronome/i }));
    expect(onAdd).toHaveBeenCalledWith("metronome");
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
