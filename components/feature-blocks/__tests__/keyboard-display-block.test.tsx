import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { KeyboardDisplayBlock } from "@/components/feature-blocks/keyboard-display-block";
import {
  getMidiSessionSnapshot,
  __resetMidiSessionForTests,
} from "@/lib/midi-session";

const defaultConfig = {
  lowNote: 48,
  octaves: 2,
  showNoteNames: true,
  computerKeys: true,
};

describe("KeyboardDisplayBlock", () => {
  beforeEach(() => {
    __resetMidiSessionForTests();
  });

  afterEach(() => {
    cleanup();
    __resetMidiSessionForTests();
  });

  it("renders white and black keys for the configured range", () => {
    render(<KeyboardDisplayBlock {...defaultConfig} />);

    // Two octaves: 24 keys total; note names repeat across octaves.
    const cKeys = screen.getAllByRole("button", { name: "C key" });
    expect(cKeys).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "C# key" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "B key" })).toHaveLength(2);
    expect(screen.getByTestId("keyboard-display").children.length).toBe(24);
  });

  it("pressing a key injects the note into the MIDI session", () => {
    const noteOn = vi.fn();
    window.addEventListener("midi-note-on", noteOn);

    render(<KeyboardDisplayBlock {...defaultConfig} />);

    const cKey = screen.getAllByRole("button", { name: "C key" })[0];
    fireEvent.pointerDown(cKey);
    expect(getMidiSessionSnapshot().heldNotes).toContain(48);
    expect(getMidiSessionSnapshot().virtualActive).toBe(true);
    expect(noteOn).toHaveBeenCalledTimes(1);

    fireEvent.pointerUp(cKey);
    expect(getMidiSessionSnapshot().heldNotes).not.toContain(48);
    expect(getMidiSessionSnapshot().virtualActive).toBe(false);

    window.removeEventListener("midi-note-on", noteOn);
  });

  it("computer keys play the home-row mapping", () => {
    render(<KeyboardDisplayBlock {...defaultConfig} />);

    fireEvent.keyDown(window, { key: "a" });
    expect(getMidiSessionSnapshot().heldNotes).toContain(48); // C3

    fireEvent.keyDown(window, { key: "w" });
    expect(getMidiSessionSnapshot().heldNotes).toContain(49); // C#3

    fireEvent.keyUp(window, { key: "a" });
    fireEvent.keyUp(window, { key: "w" });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
  });

  it("ignores computer keys while typing in an input", () => {
    render(<KeyboardDisplayBlock {...defaultConfig} />);

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: "a" });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);

    input.remove();
  });

  it("does not map computer keys when the toggle is off", () => {
    render(<KeyboardDisplayBlock {...defaultConfig} computerKeys={false} />);

    fireEvent.keyDown(window, { key: "a" });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
  });

  it("releases held notes on unmount", () => {
    render(<KeyboardDisplayBlock {...defaultConfig} />);

    const eKey = screen.getAllByRole("button", { name: "E key" })[0];
    fireEvent.pointerDown(eKey);
    expect(getMidiSessionSnapshot().heldNotes).toContain(52);

    cleanup();
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
  });
});
