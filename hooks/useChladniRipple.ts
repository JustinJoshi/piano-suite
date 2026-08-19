"use client";

import { useEffect, useRef, useState } from "react";
import type { MidiNoteEventDetail } from "@/hooks/useMidi";
import {
  normalizeVelocity,
  pruneImpulses,
  type MidiImpulse,
} from "@/lib/midi-impulse";
import {
  mapMidiToChladni,
  type ChladniRippleControls,
  type ChladniRippleVizState,
  type ModePair,
} from "@/lib/chladni-ripple";

function modePairsEqual(a: ModePair, b: ModePair): boolean {
  return a[0] === b[0] && a[1] === b[1];
}

function vizStatesEqual(
  a: ChladniRippleVizState,
  b: ChladniRippleVizState
): boolean {
  return (
    modePairsEqual(a.mode, b.mode) &&
    modePairsEqual(a.nextMode, b.nextMode) &&
    modePairsEqual(a.activeMode, b.activeMode) &&
    a.morph === b.morph &&
    a.secondaryBlend === b.secondaryBlend &&
    a.lineThickness === b.lineThickness &&
    a.lineIntensity === b.lineIntensity &&
    a.breathe === b.breathe &&
    a.activePc === b.activePc
  );
}

export type UseChladniRippleOptions = {
  heldNotes: readonly number[];
  decayMs?: number;
  octaveComplexity?: number;
  baseLineThickness?: number;
  baseIntensity?: number;
};

export type UseChladniRippleResult = {
  viz: ChladniRippleVizState;
  controls: Pick<
    ChladniRippleControls,
    "decayMs" | "octaveComplexity" | "baseLineThickness" | "baseIntensity"
  >;
};

/**
 * Drive Chladni viz props from MIDI held notes + decaying note-on impulses.
 * Listens to window `midi-note-on` for velocity; parent supplies `heldNotes`
 * from `useMidi`.
 */
export function useChladniRipple({
  heldNotes,
  decayMs = 1200,
  octaveComplexity = 0.35,
  baseLineThickness = 28,
  baseIntensity = 0.45,
}: UseChladniRippleOptions): UseChladniRippleResult {
  const [viz, setViz] = useState<ChladniRippleVizState>(() =>
    mapMidiToChladni([], [], performance.now(), {
      decayMs,
      octaveComplexity,
      baseLineThickness,
      baseIntensity,
    })
  );

  const impulsesRef = useRef<MidiImpulse[]>([]);
  const heldNotesRef = useRef(heldNotes);
  const controlsRef = useRef({
    decayMs,
    octaveComplexity,
    baseLineThickness,
    baseIntensity,
  });

  useEffect(() => {
    heldNotesRef.current = heldNotes;
  }, [heldNotes]);

  useEffect(() => {
    controlsRef.current = {
      decayMs,
      octaveComplexity,
      baseLineThickness,
      baseIntensity,
    };
  }, [decayMs, octaveComplexity, baseLineThickness, baseIntensity]);

  useEffect(() => {
    const onNoteOn = (event: Event) => {
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;
      const now = performance.now();
      impulsesRef.current = pruneImpulses(
        [
          ...impulsesRef.current,
          {
            note: detail.note,
            pc: detail.pc,
            velocity: normalizeVelocity(detail.velocity),
            bornAt: now,
          },
        ],
        now,
        controlsRef.current.decayMs
      );
    };

    window.addEventListener("midi-note-on", onNoteOn);
    window.addEventListener("music-note-on", onNoteOn);
    return () => {
      window.removeEventListener("midi-note-on", onNoteOn);
      window.removeEventListener("music-note-on", onNoteOn);
    };
  }, []);

  useEffect(() => {
    let rafId = 0;

    const tick = (now: number) => {
      const controls = controlsRef.current;
      impulsesRef.current = pruneImpulses(
        impulsesRef.current,
        now,
        controls.decayMs
      );
      const nextViz = mapMidiToChladni(
        heldNotesRef.current,
        impulsesRef.current,
        now,
        controls
      );
      setViz((current) =>
        vizStatesEqual(current, nextViz) ? current : nextViz
      );
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return {
    viz,
    controls: {
      decayMs,
      octaveComplexity,
      baseLineThickness,
      baseIntensity,
    },
  };
}
