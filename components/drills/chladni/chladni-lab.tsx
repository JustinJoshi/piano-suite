"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChladniVisualization } from "@/components/welcome/chladni-visualization";
import { Pause, Play, Shuffle } from "lucide-react";
import { randomMode } from "@/lib/chladni";

// ============================================================
// CHLADNI PATTERN LAB
// ============================================================
// Interactive parameter explorer for the square-plate Chladni
// shader. Users can dial in modes, morph speed, line thickness,
// zoom, and secondary-wave blending in real time.
// ============================================================

const PRESETS: { label: string; mode: [number, number] }[] = [
  { label: "Star", mode: [4, 5] },
  { label: "Flower", mode: [5, 7] },
  { label: "Lattice", mode: [7, 9] },
  { label: "Maze", mode: [6, 11] },
  { label: "Web", mode: [8, 11] },
];

export function ChladniLab() {
  const [mode, setMode] = useState<[number, number]>([5, 7]);
  const [nextMode, setNextMode] = useState<[number, number]>([7, 9]);
  const [morph, setMorph] = useState(0);
  const [autoMorph, setAutoMorph] = useState(true);
  const [morphSpeed, setMorphSpeed] = useState(8); // seconds per transition
  const [lineThickness, setLineThickness] = useState(30);
  const [zoom, setZoom] = useState(2.33);
  const [secondaryOffset, setSecondaryOffset] = useState<[number, number]>([1, 2]);
  const [secondaryBlend, setSecondaryBlend] = useState(0.15);
  const [secondarySpeed, setSecondarySpeed] = useState(1);
  const [secondaryMotion, setSecondaryMotion] = useState(2);
  const [breathe, setBreathe] = useState(0.2);
  const [timeScale, setTimeScale] = useState(1);

  const autoMorphRef = useRef(autoMorph);
  const morphSpeedRef = useRef(morphSpeed);
  const modeRef = useRef(mode);
  const nextModeRef = useRef(nextMode);
  const morphRef = useRef(morph);

  useEffect(() => {
    autoMorphRef.current = autoMorph;
  }, [autoMorph]);

  useEffect(() => {
    morphSpeedRef.current = morphSpeed;
  }, [morphSpeed]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    nextModeRef.current = nextMode;
  }, [nextMode]);

  useEffect(() => {
    morphRef.current = morph;
  }, [morph]);

  // Auto-morph animation loop.
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

  function applyPreset(preset: (typeof PRESETS)[number]) {
    const fresh = randomMode();
    setMode(preset.mode);
    setNextMode(fresh);
    setMorph(0);
  }

  function randomize() {
    const a = randomMode();
    const b = randomMode();
    setMode(a);
    setNextMode(b);
    setMorph(0);
  }

  function updateMode(index: 0 | 1, value: number) {
    const next = [...mode] as [number, number];
    next[index] = value;
    setMode(next);
  }

  function updateNextMode(index: 0 | 1, value: number) {
    const next = [...nextMode] as [number, number];
    next[index] = value;
    setNextMode(next);
  }

  function updateSecondaryOffset(index: 0 | 1, value: number) {
    const next = [...secondaryOffset] as [number, number];
    next[index] = value;
    setSecondaryOffset(next);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Visualization */}
      <Card className="relative min-h-[400px] overflow-hidden border-border bg-card">
        <ChladniVisualization
          mode={mode}
          nextMode={nextMode}
          morph={morph}
          lineThickness={lineThickness}
          zoom={zoom}
          secondaryOffset={secondaryOffset}
          secondaryBlend={secondaryBlend}
          secondarySpeed={secondarySpeed}
          secondaryMotion={secondaryMotion}
          breathe={breathe}
          timeScale={timeScale}
          className="absolute inset-0"
        />
        <div className="pointer-events-none absolute inset-0 hero-glow opacity-30" />
      </Card>

      {/* Controls */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-base font-semibold text-foreground">
            Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
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

          {/* Primary mode */}
          <ControlGroup label="Primary mode (m, n)">
            <NumberInput
              value={mode[0]}
              onChange={(v) => updateMode(0, v)}
              min={1}
              max={20}
            />
            <NumberInput
              value={mode[1]}
              onChange={(v) => updateMode(1, v)}
              min={1}
              max={20}
            />
          </ControlGroup>

          {/* Next mode */}
          <ControlGroup label="Next mode (m, n)">
            <NumberInput
              value={nextMode[0]}
              onChange={(v) => updateNextMode(0, v)}
              min={1}
              max={20}
            />
            <NumberInput
              value={nextMode[1]}
              onChange={(v) => updateNextMode(1, v)}
              min={1}
              max={20}
            />
          </ControlGroup>

          {/* Morph */}
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
            label="Line thickness"
            value={lineThickness}
            onChange={setLineThickness}
            min={5}
            max={120}
            step={1}
          />

          <RangeControl
            label="Zoom"
            value={zoom}
            onChange={setZoom}
            min={0.5}
            max={8}
            step={0.01}
          />

          <RangeControl
            label="Secondary blend"
            value={secondaryBlend}
            onChange={setSecondaryBlend}
            min={0}
            max={0.8}
            step={0.01}
          />

          <ControlGroup label="Secondary offset">
            <NumberInput
              value={secondaryOffset[0]}
              onChange={(v) => updateSecondaryOffset(0, v)}
              min={-10}
              max={10}
              step={0.1}
            />
            <NumberInput
              value={secondaryOffset[1]}
              onChange={(v) => updateSecondaryOffset(1, v)}
              min={-10}
              max={10}
              step={0.1}
            />
          </ControlGroup>

          <RangeControl
            label="Secondary motion speed"
            value={secondarySpeed}
            onChange={setSecondarySpeed}
            min={0}
            max={5}
            step={0.1}
          />

          <RangeControl
            label="Secondary motion amount"
            value={secondaryMotion}
            onChange={setSecondaryMotion}
            min={0}
            max={6}
            step={0.1}
          />

          <RangeControl
            label="Breathe"
            value={breathe}
            onChange={setBreathe}
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
