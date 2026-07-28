"use client";

import { useEffect, useRef, useState } from "react";
import { randomRecipe } from "@/lib/quasiperiodic";
import type { HeroQuasiperiodicSettings } from "@/lib/quasiperiodic-hero-settings";
import { QuasiperiodicVisualization } from "@/components/drills/quasiperiodic/quasiperiodic-visualization";

// ============================================================
// QUASIPERIODIC ANIMATED BACKGROUND — welcome-page atmosphere
// ============================================================
// Remounts when `settings.generation` changes (Apply / Reset).
// ============================================================

export function QuasiperiodicBackground({
  settings,
}: {
  settings: HeroQuasiperiodicSettings;
}) {
  return (
    <QuasiperiodicBackgroundInner
      key={settings.generation}
      settings={settings}
    />
  );
}

function QuasiperiodicBackgroundInner({
  settings,
}: {
  settings: HeroQuasiperiodicSettings;
}) {
  const [recipe, setRecipe] = useState(settings.recipe);
  const [nextRecipe, setNextRecipe] = useState(settings.nextRecipe);
  const [morph, setMorph] = useState(0);

  const recipeRef = useRef(recipe);
  const nextRecipeRef = useRef(nextRecipe);
  const morphRef = useRef(0);
  const morphSpeedRef = useRef(settings.morphSpeed);
  const autoMorphRef = useRef(settings.autoMorph);

  useEffect(() => {
    recipeRef.current = recipe;
  }, [recipe]);

  useEffect(() => {
    nextRecipeRef.current = nextRecipe;
  }, [nextRecipe]);

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
          const arrived = nextRecipeRef.current;
          const fresh = randomRecipe();
          recipeRef.current = arrived;
          nextRecipeRef.current = fresh;
          nextMorph = 0;
          setRecipe(arrived);
          setNextRecipe(fresh);
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
    <QuasiperiodicVisualization
      recipe={recipe}
      nextRecipe={nextRecipe}
      morph={morph}
      lineThickness={settings.lineThickness}
      zoom={settings.zoom}
      breathe={settings.breathe}
      timeScale={settings.timeScale}
      lineIntensity={settings.lineIntensity}
      colorSoftness={settings.colorSoftness}
      patternColor={settings.patternColor}
      className="h-full w-full"
    />
  );
}
