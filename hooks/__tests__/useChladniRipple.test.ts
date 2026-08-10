import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChladniRipple } from "@/hooks/useChladniRipple";
import type { MidiNoteEventDetail } from "@/hooks/useMidi";
import { IDLE_MODE, modeForNote } from "@/lib/chladni-ripple";

describe("useChladniRipple", () => {
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function runFrame(now = 100) {
    const cb = frames[frames.length - 1];
    if (cb) {
      act(() => {
        cb(now);
      });
    }
  }

  it("starts in the idle pattern", () => {
    const { result } = renderHook(() =>
      useChladniRipple({ heldNotes: [] })
    );
    runFrame();
    expect(result.current.viz.mode).toEqual(IDLE_MODE);
    expect(result.current.viz.activePc).toBeNull();
  });

  it("reacts to midi-note-on impulses with held notes", () => {
    const { result, rerender } = renderHook(
      ({ heldNotes }) => useChladniRipple({ heldNotes }),
      { initialProps: { heldNotes: [] as number[] } }
    );

    act(() => {
      window.dispatchEvent(
        new CustomEvent<MidiNoteEventDetail>("midi-note-on", {
          detail: { note: 60, pc: 0, velocity: 100 },
        })
      );
      rerender({ heldNotes: [60] });
    });

    runFrame(50);

    expect(result.current.viz.activePc).toBe(0);
    expect(result.current.viz.mode).toEqual(modeForNote(60));
    expect(result.current.viz.lineIntensity).toBeGreaterThan(0.45);
  });

  it("reacts to music-note-on impulses", () => {
    const { result } = renderHook(() => useChladniRipple({ heldNotes: [] }));

    act(() => {
      window.dispatchEvent(
        new CustomEvent<MidiNoteEventDetail>("music-note-on", {
          detail: { note: 64, pc: 4, velocity: 100 },
        })
      );
    });

    runFrame(50);

    expect(result.current.viz.activePc).toBe(4);
    expect(result.current.viz.mode).toEqual(modeForNote(64));
  });
});
