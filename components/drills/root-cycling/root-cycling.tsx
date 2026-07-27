"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MidiConnectionBar } from "@/components/drills/midi-connection-bar";
import { useRootCycling } from "@/hooks/useRootCycling";
import { ROOTS, SINGLE_QUALITIES } from "@/lib/music-theory";
import { cn } from "@/lib/utils";
import { RotateCcw } from "lucide-react";

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

export function RootCycling() {
  const drill = useRootCycling(true);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const {
    midiSupported,
    midiConnected,
    midiInputs,
    selectedInputId,
    setSelectedInputId,
    connectMidi,
    heldNotes,

    mode,
    setMode,
    qualityIdx,
    setQualityIdx,
    includedPcs,
    toggleRootIncluded,
    resetRoots,
    root,

    phase,
    running,
    repCount,
    missCount,
    liveMs,
    recentHistory,
    startDrill,
    stopDrill,
    skipToNextRoot,

    promptLabel,
    promptSymbol,
    lhNotes,
    targetDegree,
    targetNote,
    sequenceDegrees,
    sequenceTargetIdx,
  } = drill;

  return (
    <div className="space-y-6" data-testid="root-cycling-drill">
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
          <CardTitle className="font-heading text-base">Practice setup</CardTitle>
          <CardDescription>
            Choose the fixed idea to drill across random roots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SettingRow
            label="Practice Type"
            tooltip="Chord mode drills a single quality as a block chord in a random key each rep. Arpeggio mode drills the canonical minor-11th shape transposed to a random root."
          >
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Chord", value: "chord" as const },
                { label: "Arpeggio", value: "arpeggio" as const },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    mode === opt.value
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                  data-testid={`rc-mode-${opt.value}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingRow>

          {mode === "chord" && (
            <SettingRow
              label="Quality"
              tooltip="Which chord quality to drill — the root changes randomly each rep, the quality stays fixed."
            >
              <div className="flex flex-wrap gap-1.5">
                {SINGLE_QUALITIES.map((q, i) => (
                  <button
                    key={q.suffix}
                    onClick={() => setQualityIdx(i)}
                    className={cn(
                      "h-8 min-w-[2.5rem] rounded-lg border px-2 text-sm font-medium transition-colors",
                      qualityIdx === i
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                    data-testid={`rc-quality-${q.suffix}`}
                  >
                    {q.suffix}
                  </button>
                ))}
              </div>
            </SettingRow>
          )}

          <SettingRow
            label="Root Pool"
            tooltip="Which of the 12 roots are eligible to come up. Narrow this to keys you're weak in, or leave all 12 on."
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomizeOpen((v) => !v)}
              data-testid="rc-customize-btn"
            >
              {customizeOpen ? "Done" : "Customize roots"}
            </Button>
          </SettingRow>

          {customizeOpen && (
            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {ROOTS.map((r) => {
                  const included = includedPcs.includes(r.pc);
                  return (
                    <button
                      key={r.pc}
                      onClick={() => toggleRootIncluded(r.pc)}
                      className={cn(
                        "rounded-lg border py-2 text-sm font-medium transition-colors",
                        included
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground opacity-50 hover:bg-muted/50 hover:text-foreground"
                      )}
                      data-testid={`rc-root-${r.name}`}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
              <Button variant="ghost" size="sm" onClick={resetRoots} data-testid="rc-reset-roots-btn">
                Reset to all 12
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden">
        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
          <div
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              phase === "timing" || phase === "sequence"
                ? "bg-primary/10 text-primary"
                : phase === "success"
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            {mode === "chord" && phase === "awaiting-root"
              ? "play the root + 5th to begin"
              : promptLabel}
          </div>

          <div
            className="font-heading text-6xl font-semibold tracking-tight text-foreground"
            data-testid="rc-prompt-symbol"
          >
            {promptSymbol}
          </div>

          {mode === "arpeggio" && (
            <>
              <div className="font-mono text-xl tracking-wide text-muted-foreground">
                LH pedal (hold): {lhNotes.join(" + ")}
              </div>

              <div className="flex flex-wrap justify-center gap-2" data-testid="rc-cell-strip">
                {sequenceDegrees.map((deg, i) => {
                  const isCurrent = i === sequenceTargetIdx && phase === "sequence";
                  const isDone = phase === "sequence" && i < sequenceTargetIdx;
                  return (
                    <span
                      key={`${deg}-${i}`}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors",
                        isCurrent
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : isDone
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {deg}
                    </span>
                  );
                })}
              </div>

              {phase === "sequence" && targetDegree && targetNote && (
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    next ({targetDegree})
                  </div>
                  <div className="font-heading text-5xl font-semibold text-foreground">
                    {targetNote}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="font-mono text-3xl font-medium tabular-nums">
            {phase === "timing" || phase === "sequence"
              ? `${(liveMs / 1000).toFixed(2)}s`
              : "—"}
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
                disabled={!midiConnected || includedPcs.length === 0}
                data-testid="rc-start-btn"
              >
                {!midiConnected
                  ? "Connect MIDI first"
                  : includedPcs.length === 0
                  ? "Select at least one root"
                  : "Start"}
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={stopDrill}
                  data-testid="rc-stop-btn"
                >
                  Stop
                </Button>
                <Button
                  variant="outline"
                  onClick={skipToNextRoot}
                  data-testid="rc-skip-btn"
                >
                  Skip to next root →
                </Button>
              </>
            )}
          </div>

          {phase === "success" && mode === "chord" && (
            <Button variant="outline" onClick={skipToNextRoot} data-testid="rc-next-btn">
              Next root →
            </Button>
          )}

          <div className="grid w-full max-w-md grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Root</div>
              <div className="font-mono text-lg font-medium">
                {root?.name ?? "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">
                {mode === "chord" ? "Roots completed" : "Laps completed"}
              </div>
              <div className="font-mono text-lg font-medium">{repCount}</div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Misses</div>
              <div className="font-mono text-lg font-medium">{missCount}</div>
            </div>
          </div>

          {recentHistory.length > 0 && (
            <div className="text-sm text-muted-foreground" data-testid="rc-history">
              {recentHistory
                .map((h) =>
                  h.from === "—"
                    ? `${h.to} ${(h.ms / 1000).toFixed(2)}s`
                    : `${h.from}→${h.to} ${(h.ms / 1000).toFixed(2)}s`
                )
                .join("  ·  ")}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">Settings</CardTitle>
          <CardDescription>
            Restart the drill after changing the practice type or quality.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SettingRow label="Active roots">
            <div className="text-sm text-muted-foreground">
              {includedPcs.length} of 12 selected
            </div>
          </SettingRow>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => {
              resetRoots();
              stopDrill();
            }}
            data-testid="rc-clear-roots-btn"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset roots to all 12
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
