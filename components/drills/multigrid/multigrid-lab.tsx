"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultigridVisualization } from "@/components/drills/multigrid/multigrid-visualization";
import { useHeroMultigridSettings } from "@/hooks/useHeroMultigridSettings";
import { useHeroAtmosphereKind } from "@/hooks/useHeroAtmosphereKind";
import { useAmbientEffects } from "@/hooks/useAmbientEffects";
import {
  DEFAULT_HERO_MULTIGRID_SETTINGS,
  DEFAULT_LAB_MULTIGRID_SNAPSHOT,
} from "@/lib/multigrid-hero-settings";
import {
  MULTIGRID_PRESETS,
  normalizeRecipe,
  randomRecipe,
  type MultigridRecipe,
  type MultigridViewMode,
} from "@/lib/multigrid";
import { Home, Pause, Play, RotateCcw, Shuffle } from "lucide-react";

function snapLabToHeroDefaults(setters: {
  setRecipe: (v: MultigridRecipe) => void;
  setNextRecipe: (v: MultigridRecipe) => void;
  setMorph: (v: number) => void;
  setAutoMorph: (v: boolean) => void;
  setMorphSpeed: (v: number) => void;
  setViewMode: (v: MultigridViewMode) => void;
  setShowIntersections: (v: boolean) => void;
}) {
  const d = DEFAULT_HERO_MULTIGRID_SETTINGS;
  setters.setRecipe(d.recipe);
  setters.setNextRecipe(d.nextRecipe);
  setters.setMorph(0);
  setters.setAutoMorph(d.autoMorph);
  setters.setMorphSpeed(d.morphSpeed);
  setters.setViewMode(d.viewMode);
  setters.setShowIntersections(d.showIntersections);
}

export function MultigridLab() {
  const { settings, applyFromLab, updateSettings, resetSettings } =
    useHeroMultigridSettings();
  const { setKind } = useHeroAtmosphereKind();
  const { setRouteBackground } = useAmbientEffects();

  const lab = DEFAULT_LAB_MULTIGRID_SNAPSHOT;
  const [recipe, setRecipe] = useState<MultigridRecipe>(lab.recipe);
  const [nextRecipe, setNextRecipe] = useState<MultigridRecipe>(lab.nextRecipe);
  const [morph, setMorph] = useState(0);
  const [autoMorph, setAutoMorph] = useState(true);
  const [morphSpeed, setMorphSpeed] = useState(10);
  const [viewMode, setViewMode] = useState<MultigridViewMode>("grid");
  const [showIntersections, setShowIntersections] = useState(true);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  const autoMorphRef = useRef(autoMorph);
  const morphSpeedRef = useRef(morphSpeed);
  const recipeRef = useRef(recipe);
  const nextRecipeRef = useRef(nextRecipe);
  const morphRef = useRef(morph);

  useEffect(() => {
    autoMorphRef.current = autoMorph;
  }, [autoMorph]);
  useEffect(() => {
    morphSpeedRef.current = morphSpeed;
  }, [morphSpeed]);
  useEffect(() => {
    recipeRef.current = recipe;
  }, [recipe]);
  useEffect(() => {
    nextRecipeRef.current = nextRecipe;
  }, [nextRecipe]);
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
        let nextMorph = morphRef.current + delta / (morphSpeedRef.current * 1000);
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

  useEffect(() => {
    if (!applyMessage) return;
    const id = window.setTimeout(() => setApplyMessage(null), 2500);
    return () => window.clearTimeout(id);
  }, [applyMessage]);

  function applyPreset(preset: (typeof MULTIGRID_PRESETS)[number]) {
    setRecipe(normalizeRecipe({ ...recipe, ...preset.recipe }));
    setNextRecipe(randomRecipe());
    setMorph(0);
  }

  function randomizeSeed() {
    setRecipe(
      normalizeRecipe({
        ...recipe,
        randomSeed: Math.random(),
        disorder: Math.max(recipe.disorder, 0.15),
      })
    );
  }

  function patchRecipe(patch: Partial<MultigridRecipe>) {
    setRecipe(normalizeRecipe({ ...recipe, ...patch }));
  }

  function patchNextRecipe(patch: Partial<MultigridRecipe>) {
    setNextRecipe(normalizeRecipe({ ...nextRecipe, ...patch }));
  }

  function handleApplyToHome() {
    applyFromLab({
      recipe,
      nextRecipe,
      morphSpeed,
      autoMorph,
      viewMode,
      showIntersections,
      lineIntensity: 1,
      colorSoftness: 0,
    });
    setKind("multigrid");
    setRouteBackground("/", "multigrid");
    setApplyMessage("Applied to the welcome page.");
  }

  function handleResetHome() {
    resetSettings();
    setKind("multigrid");
    setRouteBackground("/", "multigrid");
    snapLabToHeroDefaults({
      setRecipe,
      setNextRecipe,
      setMorph,
      setAutoMorph,
      setMorphSpeed,
      setViewMode,
      setShowIntersections,
    });
    setApplyMessage("Home pattern reset to the default look.");
  }

  const patternColorValue =
    settings.patternColor && /^#[0-9a-fA-F]{6}$/.test(settings.patternColor)
      ? settings.patternColor
      : "#888888";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="relative min-h-[400px] overflow-hidden border-border bg-card">
        <MultigridVisualization
          recipe={recipe}
          nextRecipe={nextRecipe}
          morph={morph}
          viewMode={viewMode}
          showIntersections={showIntersections}
          patternColor={settings.patternColor}
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
          <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-3">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleApplyToHome} data-testid="apply-to-home">
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
                <Link
                  href="/"
                  className="text-primary underline-offset-2 hover:underline"
                >
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
          </div>

          <div className="flex flex-wrap gap-2">
            {MULTIGRID_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={randomizeSeed}>
              <Shuffle className="mr-1 h-3.5 w-3.5" />
              Randomize
            </Button>
          </div>

          {/* View modes Both / Tiling marked for deletion — grid (lines) only. */}

          <RangeControl
            label="Symmetry"
            value={recipe.symmetry}
            onChange={(v) => patchRecipe({ symmetry: v })}
            min={3}
            max={16}
            step={1}
          />
          <RangeControl
            label="Pattern"
            value={recipe.pattern}
            onChange={(v) => patchRecipe({ pattern: v })}
            min={0}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Rotate"
            value={recipe.rotate}
            onChange={(v) => patchRecipe({ rotate: v })}
            min={-180}
            max={180}
            step={0.1}
            suffix="°"
          />
          <RangeControl
            label="Pan"
            value={recipe.pan}
            onChange={(v) => patchRecipe({ pan: v })}
            min={0}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Disorder"
            value={recipe.disorder}
            onChange={(v) => patchRecipe({ disorder: v })}
            min={0}
            max={1}
            step={0.01}
          />
          <RangeControl
            label="Zoom"
            value={recipe.zoom}
            onChange={(v) => patchRecipe({ zoom: v })}
            min={0.3}
            max={4}
            step={0.01}
          />
          <RangeControl
            label="Radius"
            value={recipe.radius}
            onChange={(v) => patchRecipe({ radius: v })}
            min={20}
            max={200}
            step={1}
          />

          <ControlGroup label="Next symmetry / pattern">
            <NumberInput
              value={nextRecipe.symmetry}
              onChange={(v) => patchNextRecipe({ symmetry: v })}
              min={3}
              max={16}
            />
            <NumberInput
              value={nextRecipe.pattern}
              onChange={(v) => patchNextRecipe({ pattern: v })}
              min={0}
              max={1}
              step={0.01}
            />
          </ControlGroup>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Morph</Label>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setAutoMorph((p) => !p)}
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

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={showIntersections}
              onChange={(e) => setShowIntersections(e.target.checked)}
              className="accent-primary"
            />
            Show intersections
          </label>
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
          {Number.isInteger(step) || step >= 1 ? value : value.toFixed(2)}
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
