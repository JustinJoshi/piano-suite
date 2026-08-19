"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MidiNoteEventDetail } from "@/hooks/useMidi";
import {
  normalizeVelocity,
  pruneImpulses,
  snapshotImpulses,
  type MidiImpulse,
} from "@/lib/midi-impulse";

export type UseMidiImpulsesOptions = {
  decayMs?: number;
};

export type UseMidiImpulsesResult = {
  /** Currently held MIDI note numbers (from note-on until matching note-off). */
  heldNotes: readonly number[];
  /** Living decaying impulses from recent note-on events. */
  impulses: readonly MidiImpulse[];
  /** Maximum living amplitude right now, 0..1. */
  peakAmp: number;
  /** Newest living impulse, or null when idle. */
  newest: MidiImpulse | null;
  /** Strongest living impulse, or null when idle. */
  strongest: MidiImpulse | null;
};

/**
 * Shared MIDI + music reactive impulse layer.
 *
 * Listens to window `midi-note-on/off` and `music-note-on/off` events,
 * tracks held notes, and maintains a decaying impulse history. Any
 * visualization can use this to react to live notes and uploaded songs.
 */
export function useMidiImpulses({
  decayMs = 1200,
}: UseMidiImpulsesOptions = {}): UseMidiImpulsesResult {
  const decayRef = useRef(decayMs);

  useEffect(() => {
    decayRef.current = decayMs;
  }, [decayMs]);

  const [state, setState] = useState<UseMidiImpulsesResult>(() => ({
    heldNotes: [],
    impulses: [],
    peakAmp: 0,
    newest: null,
    strongest: null,
  }));

  const heldRef = useRef<Set<number>>(new Set());
  const impulsesRef = useRef<MidiImpulse[]>([]);

  const syncState = useCallback((now: number) => {
    const snapshot = snapshotImpulses(impulsesRef.current, now, {
      decayMs: decayRef.current,
    });
    impulsesRef.current = snapshot.impulses;

    setState({
      heldNotes: [...heldRef.current].sort((a, b) => a - b),
      impulses: snapshot.impulses,
      peakAmp: snapshot.peakAmp,
      newest: snapshot.newest,
      strongest: snapshot.strongest,
    });
  }, []);

  useEffect(() => {
    const onNoteOn = (event: Event) => {
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;
      const note = detail.note;
      const now = performance.now();

      heldRef.current.add(note);
      impulsesRef.current = pruneImpulses(
        [
          ...impulsesRef.current,
          {
            note,
            pc: detail.pc,
            velocity: normalizeVelocity(detail.velocity),
            bornAt: now,
          },
        ],
        now,
        decayRef.current
      );
      syncState(now);
    };

    const onNoteOff = (event: Event) => {
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;
      heldRef.current.delete(detail.note);
      syncState(performance.now());
    };

    window.addEventListener("midi-note-on", onNoteOn);
    window.addEventListener("music-note-on", onNoteOn);
    window.addEventListener("midi-note-off", onNoteOff);
    window.addEventListener("music-note-off", onNoteOff);

    return () => {
      window.removeEventListener("midi-note-on", onNoteOn);
      window.removeEventListener("music-note-on", onNoteOn);
      window.removeEventListener("midi-note-off", onNoteOff);
      window.removeEventListener("music-note-off", onNoteOff);
    };
  }, [syncState]);

  useEffect(() => {
    let rafId = 0;

    const tick = (now: number) => {
      syncState(now);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [syncState]);

  return state;
}
