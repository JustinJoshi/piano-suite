"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MidiConnectionBar } from "@/components/drills/midi-connection-bar";
import type { ChladniVisualizationProps } from "@/components/welcome/chladni-visualization";
import { useMidi } from "@/hooks/useMidi";

const ChladniVisualization = dynamic<ChladniVisualizationProps>(
  () =>
    import("@/components/welcome/chladni-visualization").then(
      (m) => m.ChladniVisualization
    ),
  { ssr: false }
);
import { useChladniRipple } from "@/hooks/useChladniRipple";
import { useAmbientEffects } from "@/hooks/useAmbientEffects";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { floatPanelUpgradeCopy } from "@/lib/billing";
import { noteName } from "@/lib/music-theory";
import { PC_MODE_TABLE } from "@/lib/chladni-ripple";
import {
  DEFAULT_RIPPLE_PARAMS,
  AMBIENT_RIPPLE_PARAMS,
  type ChladniRippleParams,
  type ModePair,
} from "@/lib/chladni-ripple-settings";
import { cn } from "@/lib/utils";
import { MusicPlayer } from "@/components/music-player/music-player";

// ============================================================
// CHLADNI RIPPLE LAB
// ============================================================
// Maps live MIDI notes onto square-plate Chladni modes: pitch
// class → pattern identity, octave → density, velocity → pulse.
// ============================================================

const PRESETS: { label: string; params: ChladniRippleParams }[] = [
  { label: "Lab", params: { ...DEFAULT_RIPPLE_PARAMS } },
  { label: "Ambient", params: { ...AMBIENT_RIPPLE_PARAMS } },
  {
    label: "Bright",
    params: {
      ...DEFAULT_RIPPLE_PARAMS,
      baseIntensity: 0.75,
      baseLineThickness: 22,
      colorSoftness: 0,
      secondaryBlend: 0.25,
    },
  },
  {
    label: "Dense",
    params: {
      ...DEFAULT_RIPPLE_PARAMS,
      octaveComplexity: 0.6,
      zoom: 2.8,
      secondaryMotion: 2.5,
      secondarySpeed: 1.4,
    },
  },
];

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">
          {display ?? value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </label>
  );
}

function NumberControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring"
      />
    </label>
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
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex gap-3">{children}</div>
    </div>
  );
}

export function ChladniRippleLab() {
  const midi = useMidi();
  const { canUseFloatPanel } = useAuthAccess();
  const {
    settings,
    applyRippleBackground,
    openFloat,
    setRouteBackground,
    setDefaultBackground,
    setApplyEverywhere,
  } = useAmbientEffects();

  // Local lab state starts from the persisted ambient ripple settings so the
  // preview matches whatever is currently applied as the background.
  const [params, setParams] = useState<ChladniRippleParams>(() => ({
    ...settings.ripple,
  }));
  const [ambientMessage, setAmbientMessage] = useState<string | null>(null);

  const { viz } = useChladniRipple({
    decayMs: params.decayMs,
    octaveComplexity: params.octaveComplexity,
    baseLineThickness: params.baseLineThickness,
    baseIntensity: params.baseIntensity,
  });

  const heldLabel =
    midi.heldNotes.length === 0
      ? "—"
      : midi.heldNotes
          .map((n) => `${noteName(n % 12)}${Math.floor(n / 12) - 1}`)
          .join(" · ");

  const activeLabel =
    viz.activePc == null
      ? "Idle"
      : `${noteName(viz.activePc)} → (${viz.activeMode[0]}, ${viz.activeMode[1]})`;

  function patch(next: Partial<ChladniRippleParams>) {
    setParams((prev) => ({ ...prev, ...next }));
  }

  function updateSecondaryOffset(index: 0 | 1, value: number) {
    const next: ModePair = [...params.secondaryOffset] as ModePair;
    next[index] = value;
    patch({ secondaryOffset: next });
  }

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setParams({ ...preset.params });
  }

  function handleReset() {
    setParams({ ...DEFAULT_RIPPLE_PARAMS });
  }

  function handleUseOnHome() {
    applyRippleBackground(params, "home");
    setAmbientMessage("Chladni Ripple set as the Welcome background.");
  }

  function handleUseEverywhere() {
    applyRippleBackground(params, "everywhere");
    setAmbientMessage("Chladni Ripple applied as the default ambient background.");
  }

  function handleOpenFloat() {
    if (!canUseFloatPanel) {
      setAmbientMessage(floatPanelUpgradeCopy("ripple-lab"));
      return;
    }
    openFloat("chladni-ripple");
    setAmbientMessage("Float panel opened with Chladni Ripple.");
  }

  function handleDisableBackground() {
    setRouteBackground("/", "none");
    setDefaultBackground("chladni");
    setApplyEverywhere(false);
    setAmbientMessage("Chladni Ripple background turned off.");
  }

  const isBackgroundOn =
    settings.routeBackgrounds["/"] === "chladni-ripple" ||
    (settings.applyEverywhere && settings.defaultBackground === "chladni-ripple");

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <Card className="overflow-hidden ring-1 ring-foreground/10">
        <CardContent className="p-0">
          <div className="relative aspect-[4/3] w-full bg-background lg:aspect-[16/9]">
            <ChladniVisualization
              mode={viz.mode}
              nextMode={viz.nextMode}
              morph={viz.morph}
              lineThickness={viz.lineThickness}
              zoom={params.zoom}
              secondaryOffset={params.secondaryOffset}
              secondaryBlend={viz.secondaryBlend}
              secondarySpeed={params.secondarySpeed}
              secondaryMotion={params.secondaryMotion}
              breathe={viz.breathe}
              timeScale={params.timeScale}
              lineIntensity={viz.lineIntensity}
              colorSoftness={params.colorSoftness}
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <MusicPlayer />

        <Card className="ring-1 ring-foreground/10">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base">MIDI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <MidiConnectionBar
              supported={midi.supported}
              connected={midi.connected}
              error={midi.error}
              inputs={midi.inputs}
              selectedInputId={midi.selectedInputId}
              onSelectInput={midi.setSelectedInputId}
              onConnect={midi.connect}
            />
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Held</span>
                <span
                  className="font-mono text-foreground"
                  data-testid="held-notes"
                >
                  {heldLabel}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Active mode</span>
                <span
                  className="font-mono text-foreground"
                  data-testid="active-mode"
                >
                  {activeLabel}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-foreground/10">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base">Ambient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Background ripple
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  isBackgroundOn ? "text-success" : "text-muted-foreground"
                )}
                data-testid="ripple-background-status"
              >
                {isBackgroundOn ? "On" : "Off"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this MIDI-reactive pattern as a page background. Pro can pop
              out a live resonance panel beside Chord Drill and other tools.
              Fine-tune routes in{" "}
              <Link
                href="/settings/atmosphere"
                className="text-primary underline-offset-2 hover:underline"
              >
                Atmosphere settings
              </Link>
              .
            </p>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleUseOnHome}
                data-testid="ripple-use-on-home"
              >
                Use on Welcome
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleUseEverywhere}
                data-testid="ripple-use-everywhere"
              >
                Use as ambient default
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleOpenFloat}
                data-testid="ripple-open-float"
              >
                {canUseFloatPanel
                  ? "Pop out while practicing"
                  : "Pop out while practicing (Pro)"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDisableBackground}
                data-testid="ripple-disable-background"
              >
                Turn off background ripple
              </Button>
            </div>
            {ambientMessage ? (
              <p className="text-xs text-primary" role="status">
                {ambientMessage}
                {!canUseFloatPanel &&
                ambientMessage === floatPanelUpgradeCopy("ripple-lab") ? (
                  <>
                    {" "}
                    <Link
                      href="/pricing"
                      className="underline underline-offset-2"
                      data-testid="ripple-float-upgrade-link"
                    >
                      See plans
                    </Link>
                  </>
                ) : null}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="ring-1 ring-foreground/10">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base">Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  data-testid={`ripple-preset-${preset.label.toLowerCase()}`}
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                data-testid="ripple-reset-params"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-foreground/10">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base">Ripple</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RangeControl
              label="Decay"
              value={params.decayMs}
              min={400}
              max={3000}
              step={50}
              onChange={(v) => patch({ decayMs: v })}
              display={`${(params.decayMs / 1000).toFixed(2)}s`}
            />
            <RangeControl
              label="Octave complexity"
              value={params.octaveComplexity}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => patch({ octaveComplexity: v })}
            />
            <RangeControl
              label="Line thickness"
              value={params.baseLineThickness}
              min={5}
              max={120}
              step={1}
              onChange={(v) => patch({ baseLineThickness: v })}
              display={String(params.baseLineThickness)}
            />
            <RangeControl
              label="Base intensity"
              value={params.baseIntensity}
              min={0.1}
              max={2}
              step={0.05}
              onChange={(v) => patch({ baseIntensity: v })}
            />
            <RangeControl
              label="Zoom"
              value={params.zoom}
              min={0.5}
              max={8}
              step={0.01}
              onChange={(v) => patch({ zoom: v })}
            />
            <RangeControl
              label="Secondary blend"
              value={params.secondaryBlend}
              min={0}
              max={0.8}
              step={0.01}
              onChange={(v) => patch({ secondaryBlend: v })}
            />
            <ControlGroup label="Secondary offset">
              <NumberControl
                label="m"
                value={params.secondaryOffset[0]}
                onChange={(v) => updateSecondaryOffset(0, v)}
                min={-10}
                max={10}
                step={0.1}
              />
              <NumberControl
                label="n"
                value={params.secondaryOffset[1]}
                onChange={(v) => updateSecondaryOffset(1, v)}
                min={-10}
                max={10}
                step={0.1}
              />
            </ControlGroup>
            <RangeControl
              label="Secondary speed"
              value={params.secondarySpeed}
              min={0}
              max={5}
              step={0.1}
              onChange={(v) => patch({ secondarySpeed: v })}
            />
            <RangeControl
              label="Secondary motion"
              value={params.secondaryMotion}
              min={0}
              max={6}
              step={0.1}
              onChange={(v) => patch({ secondaryMotion: v })}
            />
            <RangeControl
              label="Color softness"
              value={params.colorSoftness}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => patch({ colorSoftness: v })}
            />
            <RangeControl
              label="Time scale"
              value={params.timeScale}
              min={0}
              max={3}
              step={0.1}
              onChange={(v) => patch({ timeScale: v })}
            />
          </CardContent>
        </Card>

        <Card className="ring-1 ring-foreground/10">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base">
              Pitch-class map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-3 gap-2 text-xs font-mono sm:grid-cols-4">
              {PC_MODE_TABLE.map(([m, n], pc) => (
                <li
                  key={pc}
                  className={
                    viz.activePc === pc
                      ? "rounded-md bg-primary/15 px-2 py-1 text-primary"
                      : "rounded-md bg-muted/40 px-2 py-1 text-muted-foreground"
                  }
                >
                  {noteName(pc)} ({m},{n})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
