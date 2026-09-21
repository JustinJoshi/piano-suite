import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { NoteRollBlock } from "@/components/feature-blocks/note-roll-block";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import {
  pressVirtualNote,
  __resetMidiSessionForTests,
} from "@/lib/midi-session";

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
    tracking: { logPracticeEvent: {}, logMissEvent: {} },
    waitlist: { joinWaitlist: {} },
  },
}));

type FrameCb = (t: number) => void;

// Controllable frame clock shared by every test: `runFrames(t)` fires every
// scheduled, not-yet-cancelled callback once. Cancellation removes
// callbacks so a paused clock's stale frames never fire.
const scheduled = new Map<number, FrameCb>();
let nextRafId = 0;

beforeEach(() => {
  scheduled.clear();
  nextRafId = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameCb) => {
    const id = ++nextRafId;
    scheduled.set(id, cb);
    return id;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    scheduled.delete(id);
  });
});

function runFrames(t: number) {
  const fire = [...scheduled.values()];
  scheduled.clear();
  act(() => {
    fire.forEach((cb) => cb(t));
  });
}

afterEach(() => {
  cleanup();
  __resetMidiSessionForTests();
  vi.unstubAllGlobals();
});

function firstNoteBottom(): number {
  const note = screen.getAllByTestId("note-roll-note")[0];
  return parseFloat(note!.style.bottom);
}

const waitRoll = { waitMode: true } as const;
const freeRoll = { waitMode: false } as const;

function practicePage(blocks: Array<{ id: string; type: string; config: unknown }>) {
  return (
    <DrillRuntimeProvider pageId="page-1" blocks={blocks}>
      <NoteRollBlock {...waitRoll} />
    </DrillRuntimeProvider>
  );
}

const CHORD_SOURCE = [
  { id: "b1", type: "chordLibrary", config: { chords: "C, F, G" } },
  { id: "b2", type: "rhythmPattern", config: {} },
];

describe("NoteRollBlock first-note wait latch", () => {
  it("holds elapsed at zero until a fresh note-on releases the latch", () => {
    render(practicePage(CHORD_SOURCE));

    expect(screen.getByTestId("note-roll-waiting")).toBeInTheDocument();

    runFrames(100);
    runFrames(200);
    const frozen = firstNoteBottom();
    expect(frozen).toBeGreaterThan(0);

    // No movement: the clock is still waiting on the first note.
    runFrames(300);
    expect(firstNoteBottom()).toBe(frozen);

    act(() => pressVirtualNote(60));
    runFrames(400);
    runFrames(500);

    expect(firstNoteBottom()).toBeGreaterThan(frozen);
    expect(screen.queryByTestId("note-roll-waiting")).not.toBeInTheDocument();
  });

  it("does not release for song playback (music-note-on)", () => {
    render(practicePage(CHORD_SOURCE));

    act(() => {
      window.dispatchEvent(
        new CustomEvent("music-note-on", {
          detail: { note: 60, pc: 0, velocity: 80 },
        })
      );
    });
    runFrames(100);
    runFrames(200);
    const frozen = firstNoteBottom();

    runFrames(300);
    expect(firstNoteBottom()).toBe(frozen);
  });

  it("ignores a key held before the latch armed", () => {
    act(() => pressVirtualNote(60));

    render(practicePage(CHORD_SOURCE));
    runFrames(100);
    runFrames(200);
    const frozen = firstNoteBottom();

    runFrames(300);
    expect(firstNoteBottom()).toBe(frozen);
  });

  it("animates immediately with waitMode off", () => {
    render(
      <DrillRuntimeProvider pageId="page-1" blocks={CHORD_SOURCE}>
        <NoteRollBlock {...freeRoll} />
      </DrillRuntimeProvider>
    );

    runFrames(100);
    runFrames(200);
    const advanced = firstNoteBottom();

    runFrames(300);
    expect(firstNoteBottom()).toBeGreaterThan(advanced);
  });

  it("keeps the block-library preview animating even with waitMode on", () => {
    render(
      <DrillRuntimeProvider pageId="">
        <NoteRollBlock {...waitRoll} />
      </DrillRuntimeProvider>
    );

    expect(
      screen.queryByTestId("note-roll-waiting")
    ).not.toBeInTheDocument();

    runFrames(100);
    runFrames(200);
    const advanced = firstNoteBottom();

    runFrames(300);
    expect(firstNoteBottom()).toBeGreaterThan(advanced);
  });

  it("pauses and resumes from the same position (no rewind)", () => {
    render(practicePage(CHORD_SOURCE));

    act(() => pressVirtualNote(60));
    runFrames(100);
    runFrames(200);
    const running = firstNoteBottom();

    fireEvent.click(screen.getByRole("button", { name: /pause animation/i }));
    runFrames(300);
    runFrames(400);
    expect(firstNoteBottom()).toBe(running);

    fireEvent.click(screen.getByRole("button", { name: /resume animation/i }));
    runFrames(500);
    const resumed = firstNoteBottom();

    expect(resumed).toBe(running);
    runFrames(600);
    expect(firstNoteBottom()).toBeGreaterThan(resumed);
  });

  it("does not start a waiting clock from input received while paused", () => {
    render(practicePage(CHORD_SOURCE));

    fireEvent.click(screen.getByRole("button", { name: /pause animation/i }));
    act(() => pressVirtualNote(60));

    // Resume after the paused input: the roll must still be waiting.
    fireEvent.click(screen.getByRole("button", { name: /resume animation/i }));
    runFrames(100);
    runFrames(200);
    const frozen = firstNoteBottom();
    runFrames(300);
    expect(firstNoteBottom()).toBe(frozen);
    expect(screen.getByTestId("note-roll-waiting")).toBeInTheDocument();
  });

  it("re-arms when the source content is replaced", () => {
    const { rerender } = render(practicePage(CHORD_SOURCE));

    act(() => pressVirtualNote(60));
    runFrames(100);
    runFrames(200);

    rerender(
      practicePage([
        { id: "b1", type: "chordLibrary", config: { chords: "G, D, A" } },
        { id: "b2", type: "rhythmPattern", config: {} },
      ])
    );

    expect(screen.getByTestId("note-roll-waiting")).toBeInTheDocument();
    runFrames(300);
    runFrames(400);
    // The replacement content sits at its fresh position (elapsed 0), and
    // frames move nothing while it waits again.
    expect(firstNoteBottom()).toBe(24);

    act(() => pressVirtualNote(62));
    runFrames(500);
    runFrames(600);
    expect(firstNoteBottom()).toBeGreaterThan(24);
  });

  it("does not reset a running roll when the stream rebuilds with the same content", () => {
    const { rerender } = render(practicePage(CHORD_SOURCE));

    act(() => pressVirtualNote(60));
    runFrames(100);
    runFrames(200);
    const running = firstNoteBottom();

    // New array identity, identical content (what the editor does on save
    // without edits): the roll must keep advancing.
    rerender(
      practicePage(CHORD_SOURCE.map((b) => ({ ...b })))
    );

    runFrames(300);
    expect(screen.queryByTestId("note-roll-waiting")).not.toBeInTheDocument();
    expect(firstNoteBottom()).toBeGreaterThanOrEqual(running);
  });
});
