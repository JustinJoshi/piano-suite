"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { randomRecipe } from "@/lib/multigrid";
import type { HeroMultigridSettings } from "@/lib/multigrid-hero-settings";
import type { MultigridVisualizationProps } from "@/components/drills/multigrid/multigrid-visualization";

const MultigridVisualization = dynamic<MultigridVisualizationProps>(
  () =>
    import("@/components/drills/multigrid/multigrid-visualization").then(
      (m) => m.MultigridVisualization
    ),
  { ssr: false }
);

export function MultigridBackground({
  settings,
}: {
  settings: HeroMultigridSettings;
}) {
  return (
    <MultigridBackgroundInner key={settings.generation} settings={settings} />
  );
}

function MultigridBackgroundInner({
  settings,
}: {
  settings: HeroMultigridSettings;
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
    <MultigridVisualization
      recipe={recipe}
      nextRecipe={nextRecipe}
      morph={morph}
      viewMode={settings.viewMode}
      showIntersections={settings.showIntersections}
      lineIntensity={settings.lineIntensity}
      colorSoftness={settings.colorSoftness}
      patternColor={settings.patternColor}
      className="h-full w-full"
    />
  );
}
