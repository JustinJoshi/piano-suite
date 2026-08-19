"use client";

import { useEffect, useRef, useState } from "react";
import { useMidiImpulses } from "@/hooks/useMidiImpulses";
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
 * Uses the shared `useMidiImpulses` foundation so the lab reacts to both
 * live MIDI and uploaded songs, and skips React state updates when the
 * computed viz state is unchanged.
 */
export function useChladniRipple({
  decayMs = 1200,
  octaveComplexity = 0.35,
  baseLineThickness = 28,
  baseIntensity = 0.45,
}: UseChladniRippleOptions): UseChladniRippleResult {
  const { heldNotes, impulses } = useMidiImpulses({ decayMs });

  const [viz, setViz] = useState<ChladniRippleVizState>(() =>
    mapMidiToChladni([], [], performance.now(), {
      decayMs,
      octaveComplexity,
      baseLineThickness,
      baseIntensity,
    })
  );

  const heldNotesRef = useRef(heldNotes);
  const impulsesRef = useRef(impulses);
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
    impulsesRef.current = impulses;
  }, [impulses]);

  useEffect(() => {
    controlsRef.current = {
      decayMs,
      octaveComplexity,
      baseLineThickness,
      baseIntensity,
    };
  }, [decayMs, octaveComplexity, baseLineThickness, baseIntensity]);

  useEffect(() => {
    let rafId = 0;

    const tick = (now: number) => {
      const nextViz = mapMidiToChladni(
        heldNotesRef.current,
        impulsesRef.current,
        now,
        controlsRef.current
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
