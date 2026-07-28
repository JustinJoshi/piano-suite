"use client";

import { useEffect, useRef, useState } from "react";
import { randomMode } from "@/lib/chladni";
import { ChladniVisualization } from "./chladni-visualization";

// ============================================================
// CHLADNI ANIMATED BACKGROUND — Piano Suite Edition
// ============================================================
// Soft, slow, full-bleed hero atmosphere. Pattern Lab keeps the
// vivid exploration defaults; this wrapper calms motion, softens
// line color into the background, and fills the first viewport.
// ============================================================

/** Seconds per mode transition — slower than the Lab default. */
const MORPH_SECONDS = 16;

export function ChladniBackground() {
  const [mode, setMode] = useState<[number, number]>([5, 7]);
  const [nextMode, setNextMode] = useState<[number, number]>([7, 9]);
  const [morph, setMorph] = useState(0);

  const modeRef = useRef(mode);
  const nextModeRef = useRef(nextMode);
  const morphRef = useRef(0);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    nextModeRef.current = nextMode;
  }, [nextMode]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    function animate(now: number) {
      const delta = now - lastTime;
      lastTime = now;

      let nextMorph = morphRef.current + delta / (MORPH_SECONDS * 1000);

      if (nextMorph >= 1) {
        const arrived = nextModeRef.current;
        const fresh = randomMode();
        modeRef.current = arrived;
        nextModeRef.current = fresh;
        nextMorph = 0;
        setMode(arrived);
        setNextMode(fresh);
      }

      morphRef.current = nextMorph;
      setMorph(nextMorph);

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
      lineThickness={48}
      zoom={1.6}
      secondaryOffset={[1, 2]}
      secondaryBlend={0.08}
      secondarySpeed={0.6}
      secondaryMotion={1}
      breathe={0.1}
      timeScale={0.7}
      lineIntensity={0.5}
      colorSoftness={0.7}
      className="absolute inset-0 z-0 h-full w-full"
    />
  );
}
