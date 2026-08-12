"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JuliaVisualizationProps } from "@/components/drills/julia/julia-visualization";
import { SavedPatternsPanel } from "@/components/drills/saved-patterns-panel";

const JuliaVisualization = dynamic<JuliaVisualizationProps>(
  () =>
    import("@/components/drills/julia/julia-visualization").then(
      (m) => m.JuliaVisualization
    ),
  { ssr: false }
);
import { Pause, Play, Shuffle } from "lucide-react";
import { JULIA_PRESETS, randomC, type Complex } from "@/lib/julia";
import {
  normalizeJuliaLabParams,
  type JuliaLabParams,
} from "@/lib/lab-patterns";

// ============================================================
// JULIA SET LAB
// ============================================================
// Interactive parameter explorer for escape-time Julia sets.
// Users dial in complex c, morph between two values, zoom,
// iterations, escape radius, and color softness in real time.
// ============================================================

export function JuliaLab() {
  const [c, setC] = useState<Complex>([-0.75, 0.11]);
  const [nextC, setNextC] = useState<Complex>([-0.12, 0.77]);
  const [morph, setMorph] = useState(0);
  const [autoMorph, setAutoMorph] = useState(true);
  const [morphSpeed, setMorphSpeed] = useState(10);
  const [zoom, setZoom] = useState(1.2);
  const [maxIterations, setMaxIterations] = useState(128);
  const [escapeRadius, setEscapeRadius] = useState(4);
  const [colorSoftness, setColorSoftness] = useState(0);
  const [timeScale, setTimeScale] = useState(1);

  const autoMorphRef = useRef(autoMorph);
  const morphSpeedRef = useRef(morphSpeed);
  const cRef = useRef(c);
  const nextCRef = useRef(nextC);
  const morphRef = useRef(morph);

  useEffect(() => {
    autoMorphRef.current = autoMorph;
  }, [autoMorph]);

  useEffect(() => {
    morphSpeedRef.current = morphSpeed;
  }, [morphSpeed]);

  useEffect(() => {
    cRef.current = c;
  }, [c]);

  useEffect(() => {
    nextCRef.current = nextC;
  }, [nextC]);

  useEffect(() => {
    morphRef.current = morph;
  }, [morph]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    function animate(now: number) {
      const delta = now - lastTime;
      lastTime = now;

      if (autoMorphRef.current && morphSpeedRef.current > 0) {
        const step = delta / (morphSpeedRef.current * 1000);
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
      }

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  function applyPreset(preset: (typeof JULIA_PRESETS)[number]) {
    setC(preset.c);
    setNextC(randomC());
    setMorph(0);
  }

  function randomize() {
    setC(randomC());
    setNextC(randomC());
    setMorph(0);
  }

  function updateC(index: 0 | 1, value: number) {
    const next = [...c] as Complex;
    next[index] = value;
    setC(next);
  }

  function updateNextC(index: 0 | 1, value: number) {
    const next = [...nextC] as Complex;
    next[index] = value;
    setNextC(next);
  }

  function snapshotParams(): JuliaLabParams {
    return {
      c,
      nextC,
      morph,
      autoMorph,
      morphSpeed,
      zoom,
      maxIterations,
      escapeRadius,
      colorSoftness,
      timeScale,
    };
  }

  function loadParams(raw: unknown) {
    const next = normalizeJuliaLabParams(raw, snapshotParams());
    setC(next.c);
    setNextC(next.nextC);
    setMorph(next.morph);
    setAutoMorph(next.autoMorph);
    setMorphSpeed(next.morphSpeed);
    setZoom(next.zoom);
    setMaxIterations(next.maxIterations);
    setEscapeRadius(next.escapeRadius);
    setColorSoftness(next.colorSoftness);
    setTimeScale(next.timeScale);
  }

  return (
    <div className="space-y-6">
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="relative min-h-[400px] overflow-hidden border-border bg-card">
        <JuliaVisualization
          c={c}
          nextC={nextC}
          morph={morph}
          zoom={zoom}
          maxIterations={maxIterations}
          escapeRadius={escapeRadius}
          colorSoftness={colorSoftness}
          timeScale={timeScale}
          className="absolute inset-0"
        />
        <div className="pointer-events-none absolute inset-0 hero-glow opacity-30" />
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-base font-semibold text-foreground">
            Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {JULIA_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={randomize}>
              <Shuffle className="mr-1 h-3.5 w-3.5" />
              Random
            </Button>
          </div>

          <ControlGroup label="Primary c (re, im)">
            <NumberInput
              value={c[0]}
              onChange={(v) => updateC(0, v)}
              min={-2}
              max={2}
              step={0.001}
            />
            <NumberInput
              value={c[1]}
              onChange={(v) => updateC(1, v)}
              min={-2}
              max={2}
              step={0.001}
            />
          </ControlGroup>

          <ControlGroup label="Next c (re, im)">
            <NumberInput
              value={nextC[0]}
              onChange={(v) => updateNextC(0, v)}
              min={-2}
              max={2}
              step={0.001}
            />
            <NumberInput
              value={nextC[1]}
              onChange={(v) => updateNextC(1, v)}
              min={-2}
              max={2}
              step={0.001}
            />
          </ControlGroup>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Morph</Label>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setAutoMorph((prev) => !prev)}
                aria-label={autoMorph ? "Pause morph" : "Play morph"}
              >
                {autoMorph ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
            <RangeInput
              value={morph}
              onChange={setMorph}
              min={0}
              max={1}
              step={0.01}
              disabled={autoMorph}
              aria-label="Morph"
            />
          </div>

          <RangeControl
            label="Morph speed"
            value={morphSpeed}
            onChange={setMorphSpeed}
            min={1}
            max={30}
            step={0.5}
            suffix="s"
          />

          <RangeControl
            label="Zoom"
            value={zoom}
            onChange={setZoom}
            min={0.3}
            max={8}
            step={0.01}
          />

          <RangeControl
            label="Max iterations"
            value={maxIterations}
            onChange={setMaxIterations}
            min={32}
            max={256}
            step={1}
          />

          <RangeControl
            label="Escape radius"
            value={escapeRadius}
            onChange={setEscapeRadius}
            min={2}
            max={16}
            step={0.5}
          />

          <RangeControl
            label="Color softness"
            value={colorSoftness}
            onChange={setColorSoftness}
            min={0}
            max={1}
            step={0.01}
          />

          <RangeControl
            label="Time scale"
            value={timeScale}
            onChange={setTimeScale}
            min={0}
            max={3}
            step={0.1}
          />
        </CardContent>
      </Card>
    </div>

    <SavedPatternsPanel
      tool="julia"
      getParams={snapshotParams}
      onLoad={loadParams}
    />
    </div>
  );
}

function ControlGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-3">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
    />
  );
}

function RangeControl({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <RangeInput
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        aria-label={label}
      />
    </div>
  );
}

function RangeInput({
  value,
  onChange,
  min,
  max,
  step,
  disabled,
  "aria-label": ariaLabel,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary disabled:opacity-50"
    />
  );
}
