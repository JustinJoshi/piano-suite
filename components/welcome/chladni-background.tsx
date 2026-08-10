"use client";

import { useEffect, useRef, useState } from "react";
import { randomMode } from "@/lib/chladni";
import type { HeroChladniSettings } from "@/lib/chladni-hero-settings";
import { ChladniVisualization } from "./chladni-visualization";

// ============================================================
// CHLADNI ANIMATED BACKGROUND — Piano Suite Edition
// ============================================================
// Soft, slow, full-bleed fixed page atmosphere by default.
// Pattern Lab can Apply a full parameter set (plus color / scrim)
// that the parent reads from useHeroChladniSettings and passes in.
// Remounts when `settings.generation` changes (Apply / Reset).
// ============================================================

export function ChladniBackground({
  settings,
}: {
  settings: HeroChladniSettings;
}) {
  return (
    <ChladniBackgroundInner key={settings.generation} settings={settings} />
  );
}

function ChladniBackgroundInner({
  settings,
}: {
  settings: HeroChladniSettings;
}) {
  const [mode, setMode] = useState(settings.mode);
  const [nextMode, setNextMode] = useState(settings.nextMode);
  const [morph, setMorph] = useState(0);

  const modeRef = useRef(mode);
  const nextModeRef = useRef(nextMode);
  const morphRef = useRef(0);
  const morphSpeedRef = useRef(settings.morphSpeed);
  const autoMorphRef = useRef(settings.autoMorph);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    nextModeRef.current = nextMode;
  }, [nextMode]);

  useEffect(() => {
    morphSpeedRef.current = settings.morphSpeed;
  }, [settings.morphSpeed]);

  useEffect(() => {
    autoMorphRef.current = settings.autoMorph;
  }, [settings.autoMorph]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    function animate(now: number) {
      const delta = now - lastTime;
      lastTime = now;

      if (autoMorphRef.current && morphSpeedRef.current > 0) {
        let nextMorph =
          morphRef.current + delta / (morphSpeedRef.current * 1000);

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
      }

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
      lineThickness={settings.lineThickness}
      zoom={settings.zoom}
      secondaryOffset={settings.secondaryOffset}
      secondaryBlend={settings.secondaryBlend}
      secondarySpeed={settings.secondarySpeed}
      secondaryMotion={settings.secondaryMotion}
      breathe={settings.breathe}
      timeScale={settings.timeScale}
      lineIntensity={settings.lineIntensity}
      colorSoftness={settings.colorSoftness}
      patternColor={settings.patternColor}
      className="h-full w-full"
    />
  );
}
