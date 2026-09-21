"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const ROLL_TAIL_MS = 500;

export type NoteRollClockNote = {
  symbol: string;
  midi: number[];
  onsetMs?: number;
  durationMs?: number;
};

export type NoteRollClockResult = {
  nowMs: number;
  waiting: boolean;
};

/**
 * Monotonic roll clock for the note-roll block.
 *
 * The clock accumulates only active time: pauses (and reduced-motion
 * suppression) tear down the rAF loop but keep the accumulated position, so
 * resuming never rewinds. When `wait` is armed it holds `nowMs` at zero and
 * releases on the first fresh `midi-note-on` event on the window (hardware
 * note-ons and `pressVirtualNote` both dispatch it; song playback's
 * `music-note-on` never reaches this listener). Re-arm triggers are a
 * content replacement (`contentKey`), a page change (`rearmKey`), or
 * waitMode being enabled. Identity-only or timing-only updates of the same
 * content keep a running roll running.
 */
export function useNoteRollClock({
  notes,
  suppressed,
  wait,
  contentKey,
  rearmKey,
}: {
  notes: ReadonlyArray<NoteRollClockNote>;
  /** Paused or reduced-motion: no continuous frames are scheduled. */
  suppressed: boolean;
  /** Hold position until the first fresh note-on. */
  wait: boolean;
  contentKey: string;
  rearmKey: string;
}): NoteRollClockResult {
  const total = useMemo(
    () =>
      notes.reduce(
        (max, n) => Math.max(max, (n.onsetMs ?? 0) + (n.durationMs ?? 300)),
        0
      ) + ROLL_TAIL_MS,
    [notes]
  );

  const [nowMs, setNowMs] = useState(0);
  const [waiting, setWaiting] = useState(wait);
  const frameRef = useRef(0);

  // Elapsed active time lives in a ref so pause/resume keeps the position
  // across loop teardowns.
  const elapsedRef = useRef(0);

  // (Re-)arm on content replacement, page change, or waitMode being
  // enabled: adjust state during render — the sanctioned derived-state
  // pattern — so the fresh roll is visible in the same commit. Same-content
  // reloads never change `armKey`, so a running roll keeps running.
  const armKey = `${wait ? "wait" : "run"}:${contentKey}:${rearmKey}`;
  const [armedAt, setArmedAt] = useState(armKey);
  if (armedAt !== armKey) {
    setArmedAt(armKey);
    setNowMs(0);
    setWaiting(wait);
  }

  // Reset accumulation once the armed position is committed. Only ordering
  // note: this runs before the loop effect below re-schedules.
  useEffect(() => {
    elapsedRef.current = 0;
  }, [armedAt]);

  // Release on the first fresh note-on. A key already held when the latch
  // armed dispatched its event earlier, so it cannot trigger this.
  useEffect(() => {
    if (!waiting || suppressed) return;

    const release = () => setWaiting(false);
    window.addEventListener("midi-note-on", release);
    return () => window.removeEventListener("midi-note-on", release);
  }, [waiting, suppressed]);

  // Continuous rAF loop over accumulated active time. Loop-out (elapsed %
  // total) matches the previous block-local behaviour.
  useEffect(() => {
    if (suppressed || waiting) return;

    let lastT = 0;
    const tick = (t: number) => {
      if (lastT !== 0) elapsedRef.current += t - lastT;
      lastT = t;
      setNowMs(elapsedRef.current % total);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [suppressed, waiting, total]);

  return { nowMs, waiting };
}
