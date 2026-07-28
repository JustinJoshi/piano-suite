"use client";

import { useEffect, useRef, useState } from "react";
import { buildModeSequence, lerp, smoothstep } from "@/lib/chladni";
import { ChladniVisualization } from "./chladni-visualization";

// ============================================================
// CHLADNI ANIMATED BACKGROUND — Piano Suite Edition
// ============================================================
// A self-cycling Chladni background for the hero section. It
// randomly morphs between curated (m, n) modes and renders them
// through the reusable ChladniVisualization shader component.
// ============================================================

const MORPH_SPEED = 25;
const LINE_THICKNESS = 30;
const ZOOM_SCALE = 233;
const COMPLEXITY = 15;

export function ChladniBackground() {
  const [mode, setMode] = useState<[number, number]>([5, 7]);
  const [nextMode, setNextMode] = useState<[number, number]>([5, 7]);
  const [morph, setMorph] = useState(0);

  const modeSequenceRef = useRef<[number, number][]>([]);
  const modeIndexRef = useRef(0);
  const currentModeRef = useRef<[number, number]>([5, 7]);
  const targetModeRef = useRef<[number, number]>([5, 7]);
  const transitionProgressRef = useRef(0);

  useEffect(() => {
    modeSequenceRef.current = buildModeSequence(COMPLEXITY);
    if (modeSequenceRef.current.length === 0) return;

    const first = modeSequenceRef.current[0];
    currentModeRef.current = first;
    targetModeRef.current = first;
    setMode(first);
    setNextMode(first);

    const transitionSpeed = 0.0003 + (MORPH_SPEED / 100) * 0.006;

    function pickNextMode() {
      modeIndexRef.current =
        (modeIndexRef.current + 1) % modeSequenceRef.current.length;
      const next = modeSequenceRef.current[modeIndexRef.current];
      targetModeRef.current = next;
      transitionProgressRef.current = 0;
      setNextMode(next);
    }

    let rafId = 0;

    function animate() {
      transitionProgressRef.current += transitionSpeed;
      if (transitionProgressRef.current >= 1) {
        currentModeRef.current = targetModeRef.current;
        pickNextMode();
        transitionProgressRef.current = 0;
      }

      const t = smoothstep(transitionProgressRef.current);
      const current = currentModeRef.current;
      const target = targetModeRef.current;

      setMode([lerp(current[0], target[0], t), lerp(current[1], target[1], t)]);
      setNextMode(target);
      setMorph(t);

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <ChladniVisualization
      mode={mode}
      nextMode={nextMode}
      morph={morph}
      lineThickness={LINE_THICKNESS}
      zoom={ZOOM_SCALE / 100}
      className="absolute inset-0 -z-10"
    />
  );
}
