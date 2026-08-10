import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMidiImpulses } from "@/hooks/useMidiImpulses";
import type { MidiNoteEventDetail } from "@/hooks/useMidi";

function dispatchMidiNoteOn(note: number, velocity = 100) {
  window.dispatchEvent(
    new CustomEvent<MidiNoteEventDetail>("midi-note-on", {
      detail: { note, pc: ((note % 12) + 12) % 12, velocity },
    })
  );
}

function dispatchMidiNoteOff(note: number) {
  window.dispatchEvent(
    new CustomEvent<MidiNoteEventDetail>("midi-note-off", {
      detail: { note, pc: ((note % 12) + 12) % 12, velocity: 0 },
    })
  );
}

function dispatchMusicNoteOn(note: number, velocity = 100) {
  window.dispatchEvent(
    new CustomEvent<MidiNoteEventDetail>("music-note-on", {
      detail: { note, pc: ((note % 12) + 12) % 12, velocity },
    })
  );
}

describe("useMidiImpulses", () => {
  let frames: FrameRequestCallback[];
  let currentTime: number;

  beforeEach(() => {
    frames = [];
    currentTime = 1000;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.spyOn(globalThis.performance, "now").mockImplementation(() => currentTime);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function runFrame(now = 100) {
    const pending = [...frames];
    frames.length = 0;
    for (const cb of pending) {
      act(() => {
        cb(now);
      });
    }
  }

  it("starts empty", () => {
    const { result } = renderHook(() => useMidiImpulses());
    expect(result.current.heldNotes).toEqual([]);
    expect(result.current.impulses).toHaveLength(0);
    expect(result.current.peakAmp).toBe(0);
  });

  it("tracks held notes from midi-note-on and midi-note-off", () => {
    const { result } = renderHook(() => useMidiImpulses());

    act(() => {
      dispatchMidiNoteOn(60);
    });

    expect(result.current.heldNotes).toEqual([60]);

    act(() => {
      dispatchMidiNoteOn(64);
    });

    expect(result.current.heldNotes).toEqual([60, 64]);

    act(() => {
      dispatchMidiNoteOff(60);
    });

    expect(result.current.heldNotes).toEqual([64]);
  });

  it("creates impulses from midi-note-on", () => {
    const { result } = renderHook(() => useMidiImpulses());

    act(() => {
      dispatchMidiNoteOn(60, 127);
    });

    expect(result.current.impulses.length).toBeGreaterThan(0);
    expect(result.current.peakAmp).toBeCloseTo(1);
    expect(result.current.newest?.note).toBe(60);
  });

  it("reacts to music-note-on events", () => {
    const { result } = renderHook(() => useMidiImpulses());

    act(() => {
      dispatchMusicNoteOn(72, 64);
    });

    expect(result.current.heldNotes).toEqual([72]);
    expect(result.current.newest?.note).toBe(72);
    expect(result.current.newest?.velocity).toBeCloseTo(64 / 127);
  });

  it("decays impulses over time", () => {
    const { result } = renderHook(() => useMidiImpulses({ decayMs: 100 }));

    act(() => {
      dispatchMidiNoteOn(60, 127);
    });

    expect(result.current.peakAmp).toBeCloseTo(1);

    act(() => {
      currentTime += 200;
    });
    runFrame(currentTime);

    expect(result.current.impulses).toHaveLength(0);
    expect(result.current.peakAmp).toBe(0);
  });
});
