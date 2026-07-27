"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MidiConnectionBar } from "@/components/drills/midi-connection-bar";
import { useProgression } from "@/hooks/useProgression";
import { PROGRESSION_KEYS, PROGRESSION_TYPES, chordSymbol } from "@/lib/progression";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

function ToggleGroup({
  value,
  onChange,
  options,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  options: { label: string; value: boolean }[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-border p-1">
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SettingRow({
  label,
  tooltip,
  children,
}: {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{label}</div>
        {tooltip ? (
          <div className="text-xs text-muted-foreground">{tooltip}</div>
        ) : null}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function Progression() {
  const drill = useProgression(true);

  const {
    midiSupported,
    midiConnected,
    midiInputs,
    selectedInputId,
    setSelectedInputId,
    connectMidi,
    heldNotes,

    progressionType,
    setProgressionType,
    keyRoot,
    setKeyRoot,
    progression,
    currentStep,
    stepIdx,
    loopCount,

    phase,
    liveMs,
    running,
    startDrill,
    stopDrill,

    stats,
    resetStats,

    ankiFlip,
    setAnkiFlip,
    stepChime,
    setStepChime,
    loopChime,
    setLoopChime,

    ankiStatus,
  } = drill;

  const phaseLabel =
    phase === "idle"
      ? "Press Start, then lift your hands off the keys"
      : phase === "armed"
      ? "Lift your hands fully off the keys"
      : phase === "timing"
      ? "Play it…"
      : "✓ Nice";

  return (
    <div className="space-y-6" data-testid="progression-drill">
      <MidiConnectionBar
        supported={midiSupported}
        connected={midiConnected}
        error={null}
        inputs={midiInputs}
        selectedInputId={selectedInputId}
        onSelectInput={setSelectedInputId}
        onConnect={connectMidi}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">Progression</CardTitle>
          <CardDescription>
            Choose the harmonic pattern and key to practice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="text-sm font-medium">Type</div>
            <div className="flex flex-wrap gap-2">
              {PROGRESSION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setProgressionType(type)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    progressionType === type
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  data-testid={`progression-type-${type}`}
                >
                  {type === "ii-V-I" ? "ii-V-I" : "12-Bar Blues"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Key</div>
            <div className="flex flex-wrap gap-1.5">
              {PROGRESSION_KEYS.map((r) => (
                <button
                  key={r.pc}
                  onClick={() => setKeyRoot(r)}
                  className={cn(
                    "h-8 w-10 rounded-lg border text-sm font-medium transition-colors",
                    keyRoot.pc === r.pc
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  data-testid={`progression-key-${r.name}`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
          <div
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              phase === "timing"
                ? "bg-primary/10 text-primary"
                : phase === "success"
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            {phaseLabel}
          </div>

          <div
            className="font-heading text-6xl font-semibold tracking-tight text-foreground"
            data-testid="progression-current-chord"
          >
            {currentStep.symbol}
          </div>

          <div
            className="font-mono text-xl tracking-wide text-muted-foreground"
            data-testid="progression-scale-line"
          >
            {currentStep.root.name} {currentStep.scale} in the right hand
          </div>

          <div
            className="flex flex-wrap justify-center gap-2"
            data-testid="progression-step-strip"
          >
            {progression.steps.map((step, i) => (
              <div
                key={`${step.label}-${i}`}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors",
                  i === stepIdx
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : i < stepIdx
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-border text-muted-foreground"
                )}
              >
                {chordSymbol(step)}
              </div>
            ))}
          </div>

          <div className="font-mono text-3xl font-medium tabular-nums">
            {phase === "timing" ? `${(liveMs / 1000).toFixed(2)}s` : "—"}
          </div>

          <div className="text-sm text-muted-foreground">
            {heldNotes.length > 0
              ? `Holding: ${heldNotes
                  .map((n) => {
                    const pcs = [
                      "C",
                      "C#",
                      "D",
                      "D#",
                      "E",
                      "F",
                      "F#",
                      "G",
                      "G#",
                      "A",
                      "A#",
                      "B",
                    ];
                    return pcs[n % 12];
                  })
                  .join(" ")}`
              : "No keys held"}
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {!running ? (
              <Button
                onClick={startDrill}
                disabled={!midiConnected}
                data-testid="start-drill-btn"
              >
                {midiConnected ? "Start Loop" : "Connect MIDI first"}
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={stopDrill}
                data-testid="stop-drill-btn"
              >
                Stop
              </Button>
            )}
          </div>

          <div className="grid w-full max-w-md grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Step</div>
              <div className="font-mono text-lg font-medium">
                {stepIdx + 1} / {progression.steps.length}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Loop</div>
              <div className="font-mono text-lg font-medium">{loopCount}</div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Current step</div>
              <div className="font-mono text-lg font-medium">
                {currentStep.label}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">Personal bests</CardTitle>
          <CardDescription>
            Best times for {progressionType} in {keyRoot.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Best step</div>
              <div className="font-mono text-lg font-medium">
                {stats && isFinite(stats.bestStepMs)
                  ? `${(stats.bestStepMs / 1000).toFixed(2)}s`
                  : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Best average</div>
              <div className="font-mono text-lg font-medium">
                {stats && isFinite(stats.bestAvgMs)
                  ? `${(stats.bestAvgMs / 1000).toFixed(2)}s`
                  : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Total loops</div>
              <div className="font-mono text-lg font-medium">
                {stats ? stats.totalLoops : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="font-mono text-lg font-medium">{loopCount}</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-muted-foreground hover:text-destructive"
            onClick={resetStats}
            data-testid="reset-stats-btn"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Clear stats for{" "}
            {progressionType} · {keyRoot.name}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">Settings</CardTitle>
          <CardDescription>Configure audio and Anki behavior.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SettingRow
            label="Step chime"
            tooltip="Play a short chime when each chord is correct."
          >
            <ToggleGroup
              value={stepChime}
              onChange={setStepChime}
              options={[
                { label: "Off", value: false },
                { label: "On", value: true },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Loop chime"
            tooltip="Play a two-tone chime when a full loop completes."
          >
            <ToggleGroup
              value={loopChime}
              onChange={setLoopChime}
              options={[
                { label: "Off", value: false },
                { label: "On", value: true },
              ]}
            />
          </SettingRow>

          <div
            className={cn(
              "space-y-5 rounded-lg border p-4",
              ankiFlip ? "border-border" : "border-dashed border-border/50 opacity-75"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Anki Sync</div>
                <div className="text-xs text-muted-foreground">{ankiStatus}</div>
              </div>
              <ToggleGroup
                value={ankiFlip}
                onChange={setAnkiFlip}
                options={[
                  { label: "Off", value: false },
                  { label: "Flip on loop", value: true },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
