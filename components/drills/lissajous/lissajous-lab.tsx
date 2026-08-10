"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LissajousVisualization } from "@/components/drills/lissajous/lissajous-visualization";
import { SavedPatternsPanel } from "@/components/drills/saved-patterns-panel";
import { Pause, Play, Shuffle } from "lucide-react";
import {
  LISSAJOUS_PRESETS,
  formatRatioLabel,
  randomRatio,
  type LissajousParams,
} from "@/lib/lissajous";
import {
  normalizeLissajousLabParams,
  type LissajousLabParamsSnapshot,
} from "@/lib/lab-patterns";

// ============================================================
// LISSAJOUS HARMONIC LAB
// ============================================================
// Interactive parameter explorer for frequency-ratio Lissajous
// curves. Users dial in musical interval ratios, phase, morph
// between two parameter sets, trail length, and theme softness.
// ============================================================

const DEFAULT_PARAMS: LissajousParams = {
  a: 3,
  b: 2,
  delta: Math.PI / 2,
};

export function LissajousLab() {
  const [params, setParams] = useState<LissajousParams>(DEFAULT_PARAMS);
  // Use deterministic defaults for SSR hydration, then randomize on the client.
  const [nextParams, setNextParams] = useState<LissajousParams>(DEFAULT_PARAMS);
  const [morph, setMorph] = useState(0);
  const [autoMorph, setAutoMorph] = useState(true);
  const [morphSpeed, setMorphSpeed] = useState(10);
  const [sweepSpeed, setSweepSpeed] = useState(1.2);
  const [trailFade, setTrailFade] = useState(0.06);
  const [lineThickness, setLineThickness] = useState(2);
  const [zoom, setZoom] = useState(0.85);
  const [colorSoftness, setColorSoftness] = useState(0);

  const autoMorphRef = useRef(autoMorph);
  const morphSpeedRef = useRef(morphSpeed);
  const paramsRef = useRef(params);
  const nextParamsRef = useRef(nextParams);
  const morphRef = useRef(morph);
  const seededNextParamsRef = useRef(false);

  useEffect(() => {
    autoMorphRef.current = autoMorph;
  }, [autoMorph]);

  useEffect(() => {
    morphSpeedRef.current = morphSpeed;
  }, [morphSpeed]);

  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    nextParamsRef.current = nextParams;
  }, [nextParams]);

  useEffect(() => {
    morphRef.current = morph;
  }, [morph]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    function animate(now: number) {
      const delta = now - lastTime;
      lastTime = now;

      if (!seededNextParamsRef.current) {
        seededNextParamsRef.current = true;
        const fresh = randomRatio();
        nextParamsRef.current = fresh;
        setNextParams(fresh);
      }

      if (autoMorphRef.current && morphSpeedRef.current > 0) {
        const step = delta / (morphSpeedRef.current * 1000);
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
      }

      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const ratioLabel = useMemo(
    () => formatRatioLabel(params.a, params.b),
    [params.a, params.b]
  );

  function applyPreset(preset: (typeof LISSAJOUS_PRESETS)[number]) {
    setParams({ a: preset.a, b: preset.b, delta: preset.delta });
    setNextParams(randomRatio());
    setMorph(0);
  }

  function randomize() {
    setParams(randomRatio());
    setNextParams(randomRatio());
    setMorph(0);
  }

  function updateParams(patch: Partial<LissajousParams>) {
    setParams((prev) => ({ ...prev, ...patch }));
  }

  function updateNextParams(patch: Partial<LissajousParams>) {
    setNextParams((prev) => ({ ...prev, ...patch }));
  }

  function snapshotParams(): LissajousLabParamsSnapshot {
    return {
      params,
      nextParams,
      morph,
      autoMorph,
      morphSpeed,
      sweepSpeed,
      trailFade,
      lineThickness,
      zoom,
      colorSoftness,
    };
  }

  function loadParams(raw: unknown) {
    const next = normalizeLissajousLabParams(raw, snapshotParams());
    setParams(next.params);
    setNextParams(next.nextParams);
    setMorph(next.morph);
    setAutoMorph(next.autoMorph);
    setMorphSpeed(next.morphSpeed);
    setSweepSpeed(next.sweepSpeed);
    setTrailFade(next.trailFade);
    setLineThickness(next.lineThickness);
    setZoom(next.zoom);
    setColorSoftness(next.colorSoftness);
  }

  return (
    <div className="space-y-6">
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="relative min-h-[400px] overflow-hidden border-border bg-card">
        <LissajousVisualization
          params={params}
          nextParams={nextParams}
          morph={morph}
          sweepSpeed={sweepSpeed}
          trailFade={trailFade}
          lineThickness={lineThickness}
          zoom={zoom}
          colorSoftness={colorSoftness}
          className="absolute inset-0 h-full w-full"
        />
        <div className="pointer-events-none absolute inset-0 hero-glow opacity-30" />
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-base font-semibold text-foreground">
            Parameters
          </CardTitle>
          <p className="text-sm tabular-nums text-muted-foreground">
            {ratioLabel}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {LISSAJOUS_PRESETS.map((preset) => (
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

          <ControlGroup label="Frequency a, b">
            <NumberInput
              value={params.a}
              onChange={(v) => updateParams({ a: v })}
              min={1}
              max={12}
              step={1}
            />
            <NumberInput
              value={params.b}
              onChange={(v) => updateParams({ b: v })}
              min={1}
              max={12}
              step={1}
            />
          </ControlGroup>

          <ControlGroup label="Next a, b">
            <NumberInput
              value={nextParams.a}
              onChange={(v) => updateNextParams({ a: v })}
              min={1}
              max={12}
              step={1}
            />
            <NumberInput
              value={nextParams.b}
              onChange={(v) => updateNextParams({ b: v })}
              min={1}
              max={12}
              step={1}
            />
          </ControlGroup>

          <RangeControl
            label="Phase δ"
            value={Number(params.delta.toFixed(3))}
            onChange={(v) => updateParams({ delta: v })}
            min={0}
            max={Number((Math.PI * 2).toFixed(3))}
            step={0.01}
          />

          <RangeControl
            label="Next phase δ"
            value={Number(nextParams.delta.toFixed(3))}
            onChange={(v) => updateNextParams({ delta: v })}
            min={0}
            max={Number((Math.PI * 2).toFixed(3))}
            step={0.01}
          />

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
            label="Sweep speed"
            value={sweepSpeed}
            onChange={setSweepSpeed}
            min={0.1}
            max={4}
            step={0.1}
          />

          <RangeControl
            label="Trail length"
            value={Number((1 - trailFade).toFixed(2))}
            onChange={(v) => setTrailFade(Number((1 - v).toFixed(3)))}
            min={0.65}
            max={0.985}
            step={0.005}
          />

          <RangeControl
            label="Line thickness"
            value={lineThickness}
            onChange={setLineThickness}
            min={1}
            max={6}
            step={0.5}
          />

          <RangeControl
            label="Zoom"
            value={zoom}
            onChange={setZoom}
            min={0.4}
            max={1.2}
            step={0.01}
          />

          <RangeControl
            label="Color softness"
            value={colorSoftness}
            onChange={setColorSoftness}
            min={0}
            max={1}
            step={0.01}
          />
        </CardContent>
      </Card>
    </div>

    <SavedPatternsPanel
      tool="lissajous"
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
