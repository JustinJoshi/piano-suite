import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
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
  it("scopes settings field ids per tile when two gear panels are open", () => {
    render(
      <>
        <DndContext>
          <WorkshopTile
            block={tileBlock("tile-a")}
            onResize={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
            onConfigChange={vi.fn()}
          />
        </DndContext>
        <DndContext>
          <WorkshopTile
            block={tileBlock("tile-b")}
            onResize={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
            onConfigChange={vi.fn()}
          />
        </DndContext>
      </>
    );

    const settingsButtons = screen.getAllByLabelText("Tile settings");
    expect(settingsButtons).toHaveLength(2);
    settingsButtons.forEach((button) => fireEvent.click(button));

    const panels = screen.getAllByTestId("tile-settings");
    expect(panels).toHaveLength(2);

    const bpmLabels = panels.map((panel) =>
      within(panel).getByText("Tempo")
    );
    const bpmIds = bpmLabels.map((label) =>
      label.getAttribute("for")
    );
    expect(new Set(bpmIds).size).toBe(2);
    expect(bpmIds[0]).toContain("tile-a");
    expect(bpmIds[1]).toContain("tile-b");
  });
  it("resizes from the keyboard via gear-panel width and height fields", () => {
    const onResize = vi.fn();
    renderTile(tileBlock("tile-1", { w: 2, h: 1 }), { onResize });

    fireEvent.click(screen.getByLabelText("Tile settings"));

    const width = screen.getByLabelText("Width");
    const height = screen.getByLabelText("Height");
    expect(width).toHaveValue("2");
    expect(height).toHaveValue("1");

    fireEvent.change(width, { target: { value: "4" } });
    expect(onResize).toHaveBeenCalledWith("tile-1", { w: 4 });

    fireEvent.change(height, { target: { value: "3" } });
    expect(onResize).toHaveBeenCalledWith("tile-1", { h: 3 });
  });
});
