"use client";

import { useEffect, useRef, useState } from "react";
import { randomMode } from "@/lib/chladni";
import { ChladniVisualization } from "./chladni-visualization";

// ============================================================
// CHLADNI ANIMATED BACKGROUND — Piano Suite Edition
// ============================================================
// Hero background that matches the Chladni Pattern Lab defaults
// and morph behavior: discrete (m, n) pairs blended via morph,
// with the same secondary-wave / breathe settings.
// ============================================================

/** Seconds per mode transition — matches ChladniLab default. */
const MORPH_SECONDS = 8;

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
      lineThickness={30}
      zoom={2.33}
      secondaryOffset={[1, 2]}
      secondaryBlend={0.15}
      secondarySpeed={1}
      secondaryMotion={2}
      breathe={0.2}
      timeScale={1}
      className="absolute inset-0 -z-10"
    />
  );
}
