"use client";

import { useEffect, useRef, useState } from "react";
import {
  AMBIENT_JULIA,
  AMBIENT_LISSAJOUS,
  type AmbientEffectKind,
} from "@/lib/ambient-effects";
import { randomC, type Complex } from "@/lib/julia";
import { randomRatio, type LissajousParams } from "@/lib/lissajous";
import { useMidi } from "@/hooks/useMidi";
import { useChladniRipple } from "@/hooks/useChladniRipple";
import { useAmbientEffects } from "@/hooks/useAmbientEffects";
import { useExperimentalFeatures } from "@/hooks/useExperimentalFeatures";
import { useHeroChladniSettings } from "@/hooks/useHeroChladniSettings";
import { useHeroQuasiperiodicSettings } from "@/hooks/useHeroQuasiperiodicSettings";
import { useHeroMultigridSettings } from "@/hooks/useHeroMultigridSettings";
import { isExperimentalAmbientKind } from "@/lib/experimental-features";
import { ChladniBackground } from "@/components/welcome/chladni-background";
import { QuasiperiodicBackground } from "@/components/welcome/quasiperiodic-background";
import { MultigridBackground } from "@/components/welcome/multigrid-background";
import { ChladniVisualization } from "@/components/welcome/chladni-visualization";
import { JuliaVisualization } from "@/components/drills/julia/julia-visualization";
import { LissajousVisualization } from "@/components/drills/lissajous/lissajous-visualization";

function AmbientRippleEffect({
  className,
  resolutionScale,
}: {
  className?: string;
  resolutionScale?: number;
}) {
  const midi = useMidi();
  const { settings } = useAmbientEffects();
  const { viz } = useChladniRipple({
    heldNotes: midi.heldNotes,
    decayMs: settings.ripple.decayMs,
    octaveComplexity: settings.ripple.octaveComplexity,
    baseLineThickness: settings.ripple.baseLineThickness,
    baseIntensity: settings.ripple.baseIntensity,
  });

  return (
    <ChladniVisualization
      mode={viz.mode}
      nextMode={viz.nextMode}
      morph={viz.morph}
      lineThickness={viz.lineThickness}
      zoom={settings.ripple.zoom}
      secondaryOffset={settings.ripple.secondaryOffset}
      secondaryBlend={viz.secondaryBlend}
      secondarySpeed={settings.ripple.secondarySpeed}
      secondaryMotion={settings.ripple.secondaryMotion}
      breathe={viz.breathe}
      lineIntensity={viz.lineIntensity}
      colorSoftness={settings.ripple.colorSoftness}
      timeScale={settings.ripple.timeScale}
      resolutionScale={resolutionScale}
      className={className}
    />
  );
}

function AmbientChladniEffect() {
  const { settings } = useHeroChladniSettings();
  return <ChladniBackground settings={settings} />;
}

function AmbientQuasiperiodicEffect() {
  const { settings } = useHeroQuasiperiodicSettings();
  return <QuasiperiodicBackground settings={settings} />;
}

function AmbientMultigridEffect() {
  const { settings } = useHeroMultigridSettings();
  return <MultigridBackground settings={settings} />;
}

function AmbientJuliaEffect({ className }: { className?: string }) {
  const [c, setC] = useState<Complex>([...AMBIENT_JULIA.c] as Complex);
  const [nextC, setNextC] = useState<Complex>(
    [...AMBIENT_JULIA.nextC] as Complex
  );
  const [morph, setMorph] = useState(0);

  const cRef = useRef(c);
  const nextCRef = useRef(nextC);
  const morphRef = useRef(0);

  useEffect(() => {
    cRef.current = c;
  }, [c]);
  useEffect(() => {
    nextCRef.current = nextC;
  }, [nextC]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    function animate(now: number) {
      const delta = now - lastTime;
      lastTime = now;
      const step = delta / AMBIENT_JULIA.morphSpeedMs;
      let nextMorph = morphRef.current + step;
      if (nextMorph >= 1) {
        const arrived = nextCRef.current;
        const fresh = randomC();
        cRef.current = arrived;
        nextCRef.current = fresh;
        nextMorph = 0;
        setC(arrived);
        setNextC(fresh);
      }
      morphRef.current = nextMorph;
      setMorph(nextMorph);
      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <JuliaVisualization
      c={c}
      nextC={nextC}
      morph={morph}
      zoom={AMBIENT_JULIA.zoom}
      maxIterations={AMBIENT_JULIA.maxIterations}
      escapeRadius={AMBIENT_JULIA.escapeRadius}
      colorSoftness={AMBIENT_JULIA.colorSoftness}
      timeScale={AMBIENT_JULIA.timeScale}
      className={className}
    />
  );
}

function AmbientLissajousEffect({ className }: { className?: string }) {
  const [params, setParams] = useState<LissajousParams>({
    ...AMBIENT_LISSAJOUS.params,
  });
  const [nextParams, setNextParams] = useState<LissajousParams>({
    ...AMBIENT_LISSAJOUS.nextParams,
  });
  const [morph, setMorph] = useState(0);

  const paramsRef = useRef(params);
  const nextParamsRef = useRef(nextParams);
  const morphRef = useRef(0);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  useEffect(() => {
    nextParamsRef.current = nextParams;
  }, [nextParams]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    function animate(now: number) {
      const delta = now - lastTime;
      lastTime = now;
      const step = delta / AMBIENT_LISSAJOUS.morphSpeedMs;
      let nextMorph = morphRef.current + step;
      if (nextMorph >= 1) {
        const arrived = nextParamsRef.current;
        const fresh = randomRatio();
        paramsRef.current = arrived;
        nextParamsRef.current = fresh;
        nextMorph = 0;
        setParams(arrived);
        setNextParams(fresh);
      }
      morphRef.current = nextMorph;
      setMorph(nextMorph);
      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <LissajousVisualization
      params={params}
      nextParams={nextParams}
      morph={morph}
      sweepSpeed={AMBIENT_LISSAJOUS.sweepSpeed}
      trailFade={AMBIENT_LISSAJOUS.trailFade}
      lineThickness={AMBIENT_LISSAJOUS.lineThickness}
      zoom={AMBIENT_LISSAJOUS.zoom}
      colorSoftness={AMBIENT_LISSAJOUS.colorSoftness}
      className={className}
    />
  );
}

export type AmbientEffectRendererProps = {
  kind: AmbientEffectKind;
  className?: string;
  resolutionScale?: number;
};

/**
 * Props-only switch that mounts one shipped visualization for ambient use.
 * Soft defaults keep UI readable; MIDI reactivity only for chladni-ripple.
 */
export function AmbientEffectRenderer({
  kind,
  className = "h-full w-full",
  resolutionScale,
}: AmbientEffectRendererProps) {
  const { enabled: experimentalEnabled } = useExperimentalFeatures();
  const effectiveKind =
    !experimentalEnabled && isExperimentalAmbientKind(kind) ? "none" : kind;

  switch (effectiveKind) {
    case "none":
      return null;
    case "chladni":
      return <AmbientChladniEffect />;
    case "quasiperiodic":
      return <AmbientQuasiperiodicEffect />;
    case "multigrid":
      return <AmbientMultigridEffect />;
    case "chladni-ripple":
      return (
        <AmbientRippleEffect
          className={className}
          resolutionScale={resolutionScale}
        />
      );
    case "julia":
      return <AmbientJuliaEffect className={className} />;
    case "lissajous":
      return <AmbientLissajousEffect className={className} />;
    default:
      return null;
  }
}
