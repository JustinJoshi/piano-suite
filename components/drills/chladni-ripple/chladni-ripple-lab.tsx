"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MidiConnectionBar } from "@/components/drills/midi-connection-bar";
import { ChladniVisualization } from "@/components/welcome/chladni-visualization";
import { useMidi } from "@/hooks/useMidi";
import { useChladniRipple } from "@/hooks/useChladniRipple";
import { useAmbientEffects } from "@/hooks/useAmbientEffects";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { floatPanelUpgradeCopy } from "@/lib/billing";
import { noteName } from "@/lib/music-theory";
import { PC_MODE_TABLE } from "@/lib/chladni-ripple";

// ============================================================
// CHLADNI RIPPLE LAB
// ============================================================
// Maps live MIDI notes onto square-plate Chladni modes: pitch
// class → pattern identity, octave → density, velocity → pulse.
// ============================================================

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

export function ChladniRippleLab() {
  const midi = useMidi();
  const { canUseFloatPanel } = useAuthAccess();
  const { applyAsAmbientBackground, openFloat, setRouteBackground } =
    useAmbientEffects();
  const [decayMs, setDecayMs] = useState(1200);
  const [octaveComplexity, setOctaveComplexity] = useState(0.35);
  const [baseLineThickness, setBaseLineThickness] = useState(28);
  const [baseIntensity, setBaseIntensity] = useState(0.45);
  const [ambientMessage, setAmbientMessage] = useState<string | null>(null);

  const { viz } = useChladniRipple({
    heldNotes: midi.heldNotes,
    decayMs,
    octaveComplexity,
    baseLineThickness,
    baseIntensity,
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

  function handleUseOnHome() {
    setRouteBackground("/", "chladni-ripple");
    setAmbientMessage("Chladni Ripple set as the Welcome background.");
  }

  function handleUseEverywhere() {
    applyAsAmbientBackground("chladni-ripple");
    setAmbientMessage(
      "Chladni Ripple applied as the default ambient background."
    );
  }

  function handleOpenFloat() {
    if (!canUseFloatPanel) {
      setAmbientMessage(floatPanelUpgradeCopy("ripple-lab"));
      return;
    }
    openFloat("chladni-ripple");
    setAmbientMessage("Float panel opened with Chladni Ripple.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="overflow-hidden ring-1 ring-foreground/10">
        <CardContent className="p-0">
          <div className="relative aspect-square w-full bg-background sm:aspect-[4/3] lg:aspect-auto lg:min-h-[480px]">
            <ChladniVisualization
              mode={viz.mode}
              nextMode={viz.nextMode}
              morph={viz.morph}
              lineThickness={viz.lineThickness}
              zoom={2.2}
              secondaryOffset={[1, 2]}
              secondaryBlend={viz.secondaryBlend}
              secondarySpeed={1}
              secondaryMotion={1.5}
              breathe={viz.breathe}
              timeScale={1}
              lineIntensity={viz.lineIntensity}
              colorSoftness={0.15}
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
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
            <CardTitle className="font-heading text-base">Ripple</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <RangeControl
              label="Decay"
              value={decayMs}
              min={400}
              max={3000}
              step={50}
              onChange={setDecayMs}
              display={`${(decayMs / 1000).toFixed(2)}s`}
            />
            <RangeControl
              label="Octave complexity"
              value={octaveComplexity}
              min={0}
              max={0.7}
              step={0.05}
              onChange={setOctaveComplexity}
            />
            <RangeControl
              label="Line thickness"
              value={baseLineThickness}
              min={10}
              max={60}
              step={1}
              onChange={setBaseLineThickness}
              display={String(baseLineThickness)}
            />
            <RangeControl
              label="Base intensity"
              value={baseIntensity}
              min={0.2}
              max={0.9}
              step={0.05}
              onChange={setBaseIntensity}
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
