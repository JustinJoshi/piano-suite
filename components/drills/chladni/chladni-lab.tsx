"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChladniVisualizationProps } from "@/components/welcome/chladni-visualization";
import { SavedPatternsPanel } from "@/components/drills/saved-patterns-panel";

const ChladniVisualization = dynamic<ChladniVisualizationProps>(
  () =>
    import("@/components/welcome/chladni-visualization").then(
      (m) => m.ChladniVisualization
    ),
  { ssr: false }
);
import { useHeroChladniSettings } from "@/hooks/useHeroChladniSettings";
import { useHeroAtmosphereKind } from "@/hooks/useHeroAtmosphereKind";
import { useAmbientEffects } from "@/hooks/useAmbientEffects";
import {
  DEFAULT_HERO_CHLADNI_SETTINGS,
  type ModePair,
} from "@/lib/chladni-hero-settings";
import {
  normalizeChladniLabParams,
  type ChladniLabParams,
} from "@/lib/lab-patterns";
import { Pause, Play, RotateCcw, Shuffle, Home } from "lucide-react";
import { randomMode } from "@/lib/chladni";

// ============================================================
// CHLADNI PATTERN LAB
// ============================================================
// Interactive parameter explorer for the square-plate Chladni
// shader. Users can dial in modes, morph speed, line thickness,
// zoom, and secondary-wave blending in real time — then Apply
// the full state to the welcome-page hero.
// ============================================================

const PRESETS: { label: string; mode: ModePair }[] = [
  { label: "Star", mode: [4, 5] },
  { label: "Flower", mode: [5, 7] },
  { label: "Lattice", mode: [7, 9] },
  { label: "Maze", mode: [6, 11] },
  { label: "Web", mode: [8, 11] },
];

function snapLabToHeroDefaults(setters: {
  setMode: (v: ModePair) => void;
  setNextMode: (v: ModePair) => void;
  setMorph: (v: number) => void;
  setAutoMorph: (v: boolean) => void;
  setMorphSpeed: (v: number) => void;
  setLineThickness: (v: number) => void;
  setZoom: (v: number) => void;
  setSecondaryOffset: (v: ModePair) => void;
  setSecondaryBlend: (v: number) => void;
  setSecondarySpeed: (v: number) => void;
  setSecondaryMotion: (v: number) => void;
  setBreathe: (v: number) => void;
  setTimeScale: (v: number) => void;
}) {
  const d = DEFAULT_HERO_CHLADNI_SETTINGS;
  setters.setMode(d.mode);
  setters.setNextMode(d.nextMode);
  setters.setMorph(0);
  setters.setAutoMorph(d.autoMorph);
  setters.setMorphSpeed(d.morphSpeed);
  setters.setLineThickness(d.lineThickness);
  setters.setZoom(d.zoom);
  setters.setSecondaryOffset(d.secondaryOffset);
  setters.setSecondaryBlend(d.secondaryBlend);
  setters.setSecondarySpeed(d.secondarySpeed);
  setters.setSecondaryMotion(d.secondaryMotion);
  setters.setBreathe(d.breathe);
  setters.setTimeScale(d.timeScale);
}

export function ChladniLab() {
  const { settings, applyFromLab, updateSettings, resetSettings } =
    useHeroChladniSettings();
  const { setKind } = useHeroAtmosphereKind();
  const { setRouteBackground } = useAmbientEffects();

  const [mode, setMode] = useState<ModePair>([5, 7]);
  const [nextMode, setNextMode] = useState<ModePair>([7, 9]);
  const [morph, setMorph] = useState(0);
  const [autoMorph, setAutoMorph] = useState(true);
  const [morphSpeed, setMorphSpeed] = useState(8); // seconds per transition
  const [lineThickness, setLineThickness] = useState(30);
  const [zoom, setZoom] = useState(2.33);
  const [secondaryOffset, setSecondaryOffset] = useState<ModePair>([1, 2]);
  const [secondaryBlend, setSecondaryBlend] = useState(0.15);
  const [secondarySpeed, setSecondarySpeed] = useState(1);
  const [secondaryMotion, setSecondaryMotion] = useState(2);
  const [breathe, setBreathe] = useState(0.2);
  const [timeScale, setTimeScale] = useState(1);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

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

  useEffect(() => {
    if (!applyMessage) return;
    const id = window.setTimeout(() => setApplyMessage(null), 2500);
    return () => window.clearTimeout(id);
  }, [applyMessage]);

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
    const next = [...mode] as ModePair;
    next[index] = value;
    setMode(next);
  }

  function updateNextMode(index: 0 | 1, value: number) {
    const next = [...nextMode] as ModePair;
    next[index] = value;
    setNextMode(next);
  }

  function updateSecondaryOffset(index: 0 | 1, value: number) {
    const next = [...secondaryOffset] as ModePair;
    next[index] = value;
    setSecondaryOffset(next);
  }

  function handleApplyToHome() {
    applyFromLab({
      mode,
      nextMode,
      morphSpeed,
      autoMorph,
      lineThickness,
      zoom,
      secondaryOffset,
      secondaryBlend,
      secondarySpeed,
      secondaryMotion,
      breathe,
      timeScale,
      lineIntensity: 1,
      colorSoftness: 0,
    });
    setKind("chladni");
    setRouteBackground("/", "chladni");
    setApplyMessage("Applied to the welcome page.");
  }

  function handleResetHome() {
    resetSettings();
    setKind("chladni");
    setRouteBackground("/", "chladni");
    snapLabToHeroDefaults({
      setMode,
      setNextMode,
      setMorph,
      setAutoMorph,
      setMorphSpeed,
      setLineThickness,
      setZoom,
      setSecondaryOffset,
      setSecondaryBlend,
      setSecondarySpeed,
      setSecondaryMotion,
      setBreathe,
      setTimeScale,
    });
    setApplyMessage("Home pattern reset to the default look.");
  }

  function snapshotParams(): ChladniLabParams {
    return {
      mode,
      nextMode,
      morph,
      autoMorph,
      morphSpeed,
      lineThickness,
      zoom,
      secondaryOffset,
      secondaryBlend,
      secondarySpeed,
      secondaryMotion,
      breathe,
      timeScale,
    };
  }

  function loadParams(raw: unknown) {
    const next = normalizeChladniLabParams(raw, snapshotParams());
    setMode(next.mode);
    setNextMode(next.nextMode);
    setMorph(next.morph);
    setAutoMorph(next.autoMorph);
    setMorphSpeed(next.morphSpeed);
    setLineThickness(next.lineThickness);
    setZoom(next.zoom);
    setSecondaryOffset(next.secondaryOffset);
    setSecondaryBlend(next.secondaryBlend);
    setSecondarySpeed(next.secondarySpeed);
    setSecondaryMotion(next.secondaryMotion);
    setBreathe(next.breathe);
    setTimeScale(next.timeScale);
  }

  const patternColorValue =
    settings.patternColor && /^#[0-9a-fA-F]{6}$/.test(settings.patternColor)
      ? settings.patternColor
      : "#888888";

  return (
    <div className="space-y-6">
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
          patternColor={settings.patternColor}
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
          {/* Home appearance */}
          <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-3">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={handleApplyToHome}
                data-testid="apply-to-home"
              >
                <Home className="mr-1 h-3.5 w-3.5" />
                Apply to home
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetHome}
                data-testid="reset-home"
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Reset home
              </Button>
            </div>
            {applyMessage && (
              <p className="text-xs text-muted-foreground" role="status">
                {applyMessage}{" "}
                <Link href="/" className="text-primary underline-offset-2 hover:underline">
                  View welcome page
                </Link>
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Pattern color</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => updateSettings({ patternColor: null })}
                  data-testid="use-theme-color"
                >
                  Use theme
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Pattern color"
                  value={patternColorValue}
                  onChange={(e) =>
                    updateSettings({ patternColor: e.target.value })
                  }
                  className="h-9 w-12 cursor-pointer rounded border border-border bg-background"
                />
                <input
                  type="text"
                  aria-label="Pattern color hex"
                  value={settings.patternColor ?? ""}
                  placeholder="Theme default"
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    updateSettings({ patternColor: v || null });
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <RangeControl
              label="Hero shade"
              value={settings.scrimDarkness}
              onChange={(v) => updateSettings({ scrimDarkness: v })}
              min={0}
              max={1}
              step={0.01}
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              Hero shade darkens the welcome-page scrim only — not this Lab
              preview.
            </p>
          </div>

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

    <SavedPatternsPanel
      tool="chladni"
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
          {Number.isInteger(step) || step >= 1
            ? value
            : value.toFixed(2)}
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
