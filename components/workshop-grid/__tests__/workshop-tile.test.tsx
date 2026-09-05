import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { WorkshopTile } from "@/components/workshop-grid/workshop-tile";
import type { FeatureBlock } from "@/lib/feature-blocks/types";

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

function tileBlock(
  id = "tile-1",
  size?: { w: number; h: number }
): FeatureBlock {
  return {
    id,
    type: "metronome",
    version: 1,
    config: { bpm: 120 },
    ...(size ? { size } : {}),
  };
}

function renderTile(
  block: FeatureBlock = tileBlock(),
  callbacks: Partial<React.ComponentProps<typeof WorkshopTile>> = {}
) {
  return render(
    <DndContext>
      <WorkshopTile
        block={block}
        onResize={vi.fn()}
        onDuplicate={vi.fn()}
        onRemove={vi.fn()}
        onConfigChange={vi.fn()}
        {...callbacks}
      />
    </DndContext>
  );
}

describe("WorkshopTile", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reveals the toolbar when a toolbar button receives focus", () => {
    renderTile();

    const settingsButton = screen.getByLabelText("Tile settings");
    const toolbar = settingsButton.parentElement as HTMLElement;
    // Desktop hides the toolbar until hover; focus must reveal it too.
    expect(toolbar.className).toContain("md:opacity-0");

    fireEvent.focus(settingsButton);

    expect(toolbar.className).toContain("focus-within:md:opacity-100");
  });
});
