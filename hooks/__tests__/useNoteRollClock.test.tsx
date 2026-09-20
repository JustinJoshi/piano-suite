import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useNoteRollClock } from "@/hooks/useNoteRollClock";
import {
  pressVirtualNote,
  __resetMidiSessionForTests,
} from "@/lib/midi-session";

const CONTENT = "C:[60,64,67]|F:[65,69,72]";

const NOTES = [
  { symbol: "C", midi: [60, 64, 67], onsetMs: 0, durationMs: 1000 },
  { symbol: "F", midi: [65, 69, 72], onsetMs: 1000, durationMs: 1000 },
];

type FrameCb = (t: number) => void;

// Controllable rAF shared by every test: `step(t)` fires every scheduled,
// not-yet-cancelled callback once. Cancellation removes callbacks, so a
// paused clock's stale frames never fire.
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

afterEach(() => {
  __resetMidiSessionForTests();
  vi.unstubAllGlobals();
});

function step(t: number) {
  const fire = [...scheduled.values()];
  scheduled.clear();
  act(() => {
    fire.forEach((cb) => cb(t));
  });
}

type RenderClockOptions = Partial<Parameters<typeof useNoteRollClock>[0]>;

function renderClock(overrides: RenderClockOptions = {}) {
  const props = {
    notes: NOTES,
    suppressed: false,
    wait: false,
    contentKey: CONTENT,
    rearmKey: "page-1",
    ...overrides,
  };
  const hook = renderHook(() => useNoteRollClock(props));
  return {
    ...hook,
    rerender(next: RenderClockOptions = {}) {
      Object.assign(props, next);
      hook.rerender();
    },
  };
}

describe("useNoteRollClock", () => {
  it("keeps elapsed at zero across frames while waiting, then starts on a fresh note-on", () => {
    const clock = renderClock({ wait: true });

    step(100);
    step(200);
    expect(clock.result.current.nowMs).toBe(0);

    act(() => pressVirtualNote(60));
    step(300);
    step(400);

    expect(clock.result.current.nowMs).toBeGreaterThan(0);
  });

  it("advances immediately when the latch is off", () => {
    const clock = renderClock({ wait: false });

    step(100);
    const first = clock.result.current.nowMs;
    step(200);

    expect(first).toBe(0);
    expect(clock.result.current.nowMs).toBeGreaterThan(first);
  });

  it("does not release for a key held before the latch armed", () => {
    // Held key: its note-on fired before this component ever listened.
    act(() => pressVirtualNote(60));

    const clock = renderClock({ wait: true });
    step(100);
    step(200);

    expect(clock.result.current.nowMs).toBe(0);
  });

  it("does not release for song playback (music-note-on)", () => {
    const clock = renderClock({ wait: true });

    act(() => {
      window.dispatchEvent(
        new CustomEvent("music-note-on", {
          detail: { note: 60, pc: 0, velocity: 80 },
        })
      );
    });
    step(100);
    step(200);

    expect(clock.result.current.nowMs).toBe(0);
  });

  it("does not start from an input received while paused", () => {
    const clock = renderClock({ wait: true, suppressed: true });

    act(() => pressVirtualNote(60));
    // Resume after the paused input: the latch must still be waiting.
    clock.rerender({ suppressed: false });
    step(100);

    expect(clock.result.current.nowMs).toBe(0);

    act(() => pressVirtualNote(64));
    step(200);
    step(250);

    expect(clock.result.current.nowMs).toBeGreaterThan(0);
  });

  it("preserves elapsed position across pause and resume", () => {
    const clock = renderClock({ wait: false });

    step(100);
    step(150);
    const before = clock.result.current.nowMs;
    expect(before).toBeGreaterThan(0);

    // Pause: frames must not advance the clock.
    clock.rerender({ suppressed: true });
    step(200);
    step(300);
    expect(clock.result.current.nowMs).toBe(before);

    // Resume: continues from the same position — no rewind.
    clock.rerender({ suppressed: false });
    step(350);
    const resumed = clock.result.current.nowMs;
    step(400);

    expect(resumed).toBe(before);
    expect(clock.result.current.nowMs).toBeGreaterThan(resumed);
  });

  it("re-arms on content replacement", () => {
    const clock = renderClock({ wait: true });

    act(() => pressVirtualNote(60));
    step(100);
    step(150);
    expect(clock.result.current.nowMs).toBeGreaterThan(0);

    clock.rerender({ contentKey: "G:[67,71,74]" });
    step(200);
    expect(clock.result.current.waiting).toBe(true);
    expect(clock.result.current.nowMs).toBe(0);

    act(() => pressVirtualNote(62));
    step(300);
    step(350);
    expect(clock.result.current.nowMs).toBeGreaterThan(0);
  });

  it("does not reset a running roll on same-content rerenders", () => {
    const clock = renderClock({ wait: true });

    act(() => pressVirtualNote(60));
    step(100);
    step(200);
    const running = clock.result.current.nowMs;
    expect(running).toBeGreaterThan(0);

    // New stream objects, identical content — the latch must stay off and
    // the clock must keep its position.
    clock.rerender({ notes: NOTES.map((n) => ({ ...n })), wait: true });
    step(300);

    expect(clock.result.current.waiting).toBe(false);
    expect(clock.result.current.nowMs).toBeGreaterThanOrEqual(running);
  });

  it("does not reset a running roll on a timing-only update", () => {
    const clock = renderClock({ wait: false });

    step(100);
    step(200);
    const running = clock.result.current.nowMs;

    // A tempo update re-times the notes (new onsets/durations) without
    // changing them.
    clock.rerender({
      notes: [
        { ...NOTES[0]!, onsetMs: 700, durationMs: 600 },
        { ...NOTES[1]!, onsetMs: 1700 },
      ],
    });
    step(300);

    expect(clock.result.current.nowMs).toBe(running);
    expect(clock.result.current.waiting).toBe(false);
  });

  it("re-arms on a page change", () => {
    const clock = renderClock({ wait: true });

    act(() => pressVirtualNote(60));
    step(100);
    step(150);
    expect(clock.result.current.nowMs).toBeGreaterThan(0);

    clock.rerender({ rearmKey: "page-2" });
    step(200);

    expect(clock.result.current.waiting).toBe(true);
    expect(clock.result.current.nowMs).toBe(0);
  });

  it("re-arms when waitMode is enabled on a running roll", () => {
    const clock = renderClock({ wait: false, rearmKey: "page-1" });

    step(100);
    step(150);
    expect(clock.result.current.nowMs).toBeGreaterThan(0);

    clock.rerender({ wait: true });
    step(200);

    expect(clock.result.current.waiting).toBe(true);
    expect(clock.result.current.nowMs).toBe(0);
  });

  it("schedules no continuous rAF frames while suppressed", () => {
    renderClock({ wait: true, suppressed: true });
    step(100);

    // Nothing was scheduled, so nothing needed cancelling.
    expect(scheduled.size).toBe(0);
  });

  it("removes the note-on listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const clock = renderClock({ wait: true });

    clock.unmount();
    expect(removeSpy.mock.calls.some(([type]) => type === "midi-note-on")).toBe(
      true
    );
  });
});
