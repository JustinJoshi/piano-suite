import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ROLL_NOTE_OFF,
  ROLL_NOTE_ON,
  __resetRollAudioForTests,
  playRollSequence,
  releaseRollSource,
  rollNoteOff,
  rollNoteOn,
} from "@/lib/roll-audio";

function record() {
  const events: string[] = [];
  const names = ["music-note-on", "music-note-off", ROLL_NOTE_ON, ROLL_NOTE_OFF];
  const handler = (e: Event) => events.push(`${e.type}:${(e as CustomEvent).detail.note}`);
  names.forEach((n) => window.addEventListener(n, handler));
  return { events, stop: () => names.forEach((n) => window.removeEventListener(n, handler)) };
}

describe("roll audio channel", () => {
  beforeEach(() => __resetRollAudioForTests());
  afterEach(() => vi.useRealTimers());

  it("plays an audible note through the music channel the audio host already plays", () => {
    const rec = record();
    rollNoteOn(60, "a");
    rollNoteOff(60, "a");
    rec.stop();
    expect(rec.events).toEqual(["music-note-on:60", "music-note-off:60"]);
  });

  it("only lights the bar for a silent note", () => {
    const rec = record();
    rollNoteOn(64, "a", { audible: false });
    rollNoteOff(64, "a");
    rec.stop();
    expect(rec.events).toEqual([`${ROLL_NOTE_ON}:64`, `${ROLL_NOTE_OFF}:64`]);
  });

  it("starts and stops a shared pitch once across sources", () => {
    const rec = record();
    rollNoteOn(67, "a");
    rollNoteOn(67, "b");
    rollNoteOn(67, "b"); // same holder again: ignored
    rollNoteOff(67, "a");
    expect(rec.events).toEqual(["music-note-on:67"]);
    rollNoteOff(67, "b");
    rec.stop();
    expect(rec.events).toEqual(["music-note-on:67", "music-note-off:67"]);
  });

  it("releases everything a source prefix holds", () => {
    const rec = record();
    rollNoteOn(60, "roll0:1");
    rollNoteOn(62, "roll0:2");
    rollNoteOn(65, "hear:1");
    releaseRollSource("roll0");
    rec.stop();
    expect(rec.events).toEqual(["music-note-on:60", "music-note-on:62", "music-note-on:65", "music-note-off:60", "music-note-off:62"]);
  });

  it("sequences notes at a tempo and cleans up when stopped early", () => {
    vi.useFakeTimers();
    const rec = record();
    const started: number[] = [];
    let done = 0;
    const stop = playRollSequence(
      [{ p: 60, t: 0, d: 1 }, { p: 64, t: 1, d: 1 }, { p: "tick", t: 0 }],
      { bpm: 60, source: "seq", onStart: (i) => started.push(i), onDone: () => done++ }
    );
    vi.advanceTimersByTime(1500);
    expect(started).toEqual([0, 2, 1]);
    stop();
    rec.stop();
    expect(rec.events).toEqual(["music-note-on:60", "music-note-off:60", "music-note-on:64", "music-note-off:64"]);
    expect(done).toBe(1);
  });
});
