import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { GridBody, WorkshopGrid } from "@/components/workshop-grid/workshop-grid";
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

function block(id: string, size?: { w: number; h: number }): FeatureBlock {
  return {
    id,
    type: "metronome",
    version: 1,
    config: { bpm: 120 },
    ...(size ? { size } : {}),
  };
}

function renderBody(ui: React.ReactElement) {
  return render(<DndContext>{ui}</DndContext>);
}

const bodyProps = {
  onResize: vi.fn(),
  onDuplicate: vi.fn(),
  onRemove: vi.fn(),
};

describe("WorkshopGrid", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders every block's feature", () => {
    render(
      <WorkshopGrid
        blocks={[block("a"), block("b")]}
        onReorder={vi.fn()}
        {...bodyProps}
      />
    );

    expect(screen.getAllByTestId("bpm-display")).toHaveLength(2);
  });

  it("hides grid chrome outside of drags", () => {
    renderBody(
      <GridBody blocks={[block("a")]} gridActive={false} {...bodyProps} />
    );

    const grid = screen.getByTestId("workshop-grid");
    expect(grid.getAttribute("data-grid-active")).toBeNull();
    expect(screen.queryByTestId("grid-guide")).not.toBeInTheDocument();
  });

  it("shows the grid while a drag is active", () => {
    renderBody(
      <GridBody blocks={[block("a")]} gridActive={true} {...bodyProps} />
    );

    const grid = screen.getByTestId("workshop-grid");
    expect(grid.getAttribute("data-grid-active")).toBe("true");
    expect(screen.getAllByTestId("grid-guide")).toHaveLength(4);
  });

  it("applies stored spans to tiles", () => {
    renderBody(
      <GridBody
        blocks={[block("a", { w: 3, h: 2 }), block("b")]}
        gridActive={false}
        {...bodyProps}
      />
    );

    const sized = screen
      .getAllByTestId("bpm-display")[0]
      .closest("[data-workshop-tile]") as HTMLElement;
    expect(sized.className).toContain("xl:col-span-3");
    expect(sized.style.gridRow).toBe("span 2");

    const fallback = screen
      .getAllByTestId("bpm-display")[1]
      .closest("[data-workshop-tile]") as HTMLElement;
    // Metronome default width is 2 → full width at md.
    expect(fallback.className).toContain("md:col-span-2");
    expect(fallback.style.gridRow).toBe("span 1");
  });

  it("calls onResize with grid units while dragging the resize handle", () => {
    const onResize = vi.fn();
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

    renderBody(
      <GridBody
        blocks={[block("a", { w: 2, h: 1 })]}
        gridActive={false}
        onResize={onResize}
        onDuplicate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    fireEvent.pointerDown(screen.getByLabelText("Resize tile"), {
      clientX: 0,
      clientY: 0,
    });
    // matchMedia reports no match → 1 active column → cell width 400px.
    fireEvent.pointerMove(window, { clientX: 410, clientY: 0 });
    expect(onResize).toHaveBeenCalledWith("a", { w: 3, h: 1 });

    fireEvent.pointerUp(window);
    fireEvent.pointerMove(window, { clientX: 1200, clientY: 0 });
    expect(onResize).toHaveBeenCalledTimes(1);
  });

  it("calls onDuplicate and onRemove from the tile toolbar", () => {
    const onDuplicate = vi.fn();
    const onRemove = vi.fn();

    renderBody(
      <GridBody
        blocks={[block("a")]}
        gridActive={false}
        onResize={vi.fn()}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />
    );

    fireEvent.click(screen.getByLabelText("Duplicate"));
    expect(onDuplicate).toHaveBeenCalledWith("a");

    fireEvent.click(screen.getByLabelText("Remove"));
    expect(onRemove).toHaveBeenCalledWith("a");
  });
});
