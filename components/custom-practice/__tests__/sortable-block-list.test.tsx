import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SortableBlockList } from "@/components/custom-practice/sortable-block-list";
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

const blocks: FeatureBlock[] = [
  { id: "a", type: "metronome", version: 1, config: { bpm: 100 } },
  { id: "b", type: "metronome", version: 1, config: { bpm: 120 } },
];

describe("SortableBlockList", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", vi.fn(createMockAudioContext));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders each block", () => {
    render(
      <SortableBlockList
        blocks={blocks}
        selectedBlockId={null}
        onSelect={vi.fn()}
        onReorder={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
        onRemove={vi.fn()}
        onInsertAtIndex={vi.fn()}
      />
    );

    expect(screen.getAllByTestId("bpm-display")).toHaveLength(2);
  });

  it("calls onMoveDown when the move down button is clicked", () => {
    const onMoveDown = vi.fn();

    render(
      <SortableBlockList
        blocks={blocks}
        selectedBlockId={null}
        onSelect={vi.fn()}
        onReorder={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={onMoveDown}
        onDuplicate={vi.fn()}
        onRemove={vi.fn()}
        onInsertAtIndex={vi.fn()}
      />
    );

    const moveDownButtons = screen.getAllByLabelText("Move down");
    expect(moveDownButtons[0]).toBeEnabled();
    expect(moveDownButtons[1]).toBeDisabled();

    fireEvent.click(moveDownButtons[0]);
    expect(onMoveDown).toHaveBeenCalledWith("a");
  });

  it("calls onMoveUp when the move up button is clicked", () => {
    const onMoveUp = vi.fn();

    render(
      <SortableBlockList
        blocks={blocks}
        selectedBlockId={null}
        onSelect={vi.fn()}
        onReorder={vi.fn()}
        onMoveUp={onMoveUp}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
        onRemove={vi.fn()}
        onInsertAtIndex={vi.fn()}
      />
    );

    const moveUpButtons = screen.getAllByLabelText("Move up");
    expect(moveUpButtons[0]).toBeDisabled();
    expect(moveUpButtons[1]).toBeEnabled();

    fireEvent.click(moveUpButtons[1]);
    expect(onMoveUp).toHaveBeenCalledWith("b");
  });

  it("calls onInsertAtIndex with 0 when the top placeholder is clicked", () => {
    const onInsertAtIndex = vi.fn();

    render(
      <SortableBlockList
        blocks={blocks}
        selectedBlockId={null}
        onSelect={vi.fn()}
        onReorder={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onDuplicate={vi.fn()}
        onRemove={vi.fn()}
        onInsertAtIndex={onInsertAtIndex}
      />
    );

    const placeholders = screen.getAllByRole("button", { name: /add feature/i });
    fireEvent.click(placeholders[0]);

    expect(onInsertAtIndex).toHaveBeenCalledWith(0);
  });
});
