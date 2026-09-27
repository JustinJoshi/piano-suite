import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { PlayableKeybed } from "@/components/welcome/playable-keybed";
import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";
import { defaultWelcomeConfig } from "@/lib/welcome-config";
import {
  getMidiSessionSnapshot,
  __resetMidiSessionForTests,
} from "@/lib/midi-session";

const C4 = 60;

/** jsdom has no layout; point elementFromPoint at a chosen key group. */
function pointAtKey(note: number): void {
  const keybed = screen.getAllByTestId("keybed")[0];
  const group = keybed?.querySelector(`[data-note="${note}"]`);
  if (!group) throw new Error(`no key group for note ${note}`);
  document.elementFromPoint = vi.fn().mockReturnValue(group) as never;
}

function renderKeybed() {
  return render(
    <WelcomeConfigProvider>
      <PlayableKeybed />
    </WelcomeConfigProvider>
  );
}

describe("PlayableKeybed", () => {
  let noteOnCalls: CustomEvent[];
  let noteOffCalls: CustomEvent[];
  const noteOn = (event: Event) => noteOnCalls.push(event as CustomEvent);
  const noteOff = (event: Event) => noteOffCalls.push(event as CustomEvent);

  beforeEach(() => {
    __resetMidiSessionForTests();
    noteOnCalls = [];
    noteOffCalls = [];
    window.addEventListener("midi-note-on", noteOn);
    window.addEventListener("midi-note-off", noteOff);
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as never;
  });

  afterEach(() => {
    window.removeEventListener("midi-note-on", noteOn);
    window.removeEventListener("midi-note-off", noteOff);
    cleanup();
    __resetMidiSessionForTests();
  });

  it("exposes a named focusable entry outside any aria-hidden subtree", () => {
    renderKeybed();

    const entry = screen.getByRole("button", {
      name: defaultWelcomeConfig.instrument.playLabel,
    });
    expect(entry.closest("[aria-hidden]")).toBeNull();
    expect(
      screen.getByTestId("hero-instrument").closest("[aria-hidden]")
    ).toBeNull();

    // Decorative key shapes stay hidden; instructions and readout do not.
    for (const keybed of screen.getAllByTestId("keybed")) {
      expect(keybed).toHaveAttribute("aria-hidden", "true");
    }
    expect(screen.getByText("Cmaj7 · C E G B")).toBeInTheDocument();
    expect(screen.getByText("Cmaj7 · C E G B").closest("[aria-hidden]")).toBeNull();
  });

  it("describes the entry with the welcome-config instructions", () => {
    renderKeybed();

    const entry = screen.getByRole("button", {
      name: defaultWelcomeConfig.instrument.playLabel,
    });
    const describedBy = entry.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const instructions = document.getElementById(describedBy!);
    expect(instructions).toHaveTextContent(
      defaultWelcomeConfig.instrument.instructions
    );
  });

  it("activating the entry and pressing KeyA plays C4 with no pointer event", () => {
    renderKeybed();

    const entry = screen.getByRole("button", {
      name: defaultWelcomeConfig.instrument.playLabel,
    });
    act(() => entry.focus());
    fireEvent.keyDown(entry, { key: "Enter", code: "Enter" });

    fireEvent.keyDown(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toContain(C4);
    expect(noteOnCalls).toHaveLength(1);
    expect(noteOnCalls[0]!.detail.note).toBe(C4);

    fireEvent.keyUp(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
    expect(noteOffCalls[0]!.detail.note).toBe(C4);
  });

  it("plays from a keyboard activation before any pointer action", () => {
    renderKeybed();

    const entry = screen.getByRole("button", {
      name: defaultWelcomeConfig.instrument.playLabel,
    });
    fireEvent.keyDown(entry, { key: "Enter", code: "Enter" });

    fireEvent.keyDown(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toContain(C4);

    fireEvent.keyUp(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
  });

  it("names what is held on the readout", () => {
    renderKeybed();

    act(() =>
      screen
        .getByRole("button", { name: defaultWelcomeConfig.instrument.playLabel })
        .focus()
    );
    fireEvent.keyDown(window, { key: "a", code: "KeyA" });

    expect(screen.getByText("C4")).toBeInTheDocument();
  });

  it("never claims letters from a reader who has not engaged it", () => {
    renderKeybed();

    fireEvent.keyDown(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
    expect(noteOnCalls).toEqual([]);
  });

  it("stops claiming letters once focus leaves, without a pointer opt-in", () => {
    renderKeybed();

    const entry = screen.getByRole("button", {
      name: defaultWelcomeConfig.instrument.playLabel,
    });
    act(() => entry.focus());
    fireEvent.keyDown(window, { key: "a", code: "KeyA" });
    fireEvent.keyUp(window, { key: "a", code: "KeyA" });

    act(() => entry.blur());
    fireEvent.keyDown(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
  });

  it("ignores modified shortcuts", () => {
    renderKeybed();

    act(() =>
      screen
        .getByRole("button", { name: defaultWelcomeConfig.instrument.playLabel })
        .focus()
    );

    fireEvent.keyDown(window, { key: "a", code: "KeyA", ctrlKey: true });
    fireEvent.keyDown(window, { key: "a", code: "KeyA", metaKey: true });
    fireEvent.keyDown(window, { key: "a", code: "KeyA", altKey: true });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
  });

  it("ignores letters typed in an input or contenteditable", () => {
    renderKeybed();

    act(() =>
      screen
        .getByRole("button", { name: defaultWelcomeConfig.instrument.playLabel })
        .focus()
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "a", code: "KeyA" });
    input.remove();

    // jsdom never computes isContentEditable; stand in for the real flag.
    const editable = document.createElement("div");
    Object.defineProperty(editable, "isContentEditable", { value: true });
    document.body.appendChild(editable);
    fireEvent.keyDown(editable, { key: "a", code: "KeyA" });
    editable.remove();

    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
  });

  it("focus loss releases every note the hero owns", () => {
    renderKeybed();

    const entry = screen.getByRole("button", {
      name: defaultWelcomeConfig.instrument.playLabel,
    });
    act(() => entry.focus());
    fireEvent.keyDown(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toContain(C4);

    act(() => entry.blur());
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);

    // The keyup for the released note must not strand anything.
    fireEvent.keyUp(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
  });

  it("window blur releases notes and clears both ownership maps", () => {
    renderKeybed();

    act(() =>
      screen
        .getByRole("button", { name: defaultWelcomeConfig.instrument.playLabel })
        .focus()
    );
    fireEvent.keyDown(window, { key: "a", code: "KeyA" });
    fireEvent.blur(window);
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);

    // A stale pointer map would swallow this keyup and strand the note.
    pointAtKey(C4);
    fireEvent.pointerDown(screen.getAllByTestId("keybed")[0]!, {
      pointerId: 1,
      clientX: 10,
      clientY: 10,
    });
    fireEvent.pointerUp(screen.getAllByTestId("keybed")[0]!, { pointerId: 1 });
    fireEvent.keyDown(window, { key: "a", code: "KeyA" });
    fireEvent.keyUp(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
  });

  it("unmount releases every note the hero owns", () => {
    renderKeybed();

    act(() =>
      screen
        .getByRole("button", { name: defaultWelcomeConfig.instrument.playLabel })
        .focus()
    );
    fireEvent.keyDown(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toContain(C4);

    cleanup();
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
  });

  it("pointer notes, glissando and the pointer opt-in keep working", () => {
    renderKeybed();
    const keybed = screen.getAllByTestId("keybed")[0]!;

    pointAtKey(C4);
    fireEvent.pointerDown(keybed, { pointerId: 7, clientX: 10, clientY: 10 });
    expect(getMidiSessionSnapshot().heldNotes).toContain(C4);

    // Drag sideways: the next key replaces the previous one.
    pointAtKey(62);
    fireEvent.pointerMove(keybed, { pointerId: 7, clientX: 30, clientY: 10 });
    expect(getMidiSessionSnapshot().heldNotes).toContain(62);
    expect(getMidiSessionSnapshot().heldNotes).not.toContain(C4);

    fireEvent.pointerUp(keybed, { pointerId: 7 });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);

    // A pointer note is the existing opt-in: letters work with no focus.
    fireEvent.keyDown(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toContain(C4);
    fireEvent.keyUp(window, { key: "a", code: "KeyA" });
    expect(getMidiSessionSnapshot().heldNotes).toEqual([]);
  });

  it("keeps the desktop and phone ranges unchanged", () => {
    renderKeybed();
    const [desktop, phone] = screen.getAllByTestId("keybed");

    const notesOf = (keybed: Element) =>
      [...keybed.querySelectorAll("[data-note]")].map((g) =>
        Number(g.getAttribute("data-note"))
      );

    const desktopNotes = notesOf(desktop!);
    const phoneNotes = notesOf(phone!);
    expect(Math.min(...desktopNotes)).toBe(48);
    expect(Math.max(...desktopNotes)).toBe(84);
    expect(desktopNotes).toHaveLength(37);
    expect(Math.min(...phoneNotes)).toBe(60);
    expect(Math.max(...phoneNotes)).toBe(72);
    expect(phoneNotes).toHaveLength(13);
  });
});
