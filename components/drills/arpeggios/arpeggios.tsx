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
import { useArpeggios } from "@/hooks/useArpeggios";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { cn } from "@/lib/utils";
import { SHARP_NAMES } from "@/lib/music-theory";
import { ChevronUp, ChevronDown, RotateCcw } from "lucide-react";

const GRADE_COLORS = {
  Again: "bg-grade-again text-white",
  Hard: "bg-grade-hard text-black",
  Good: "bg-grade-good text-white",
};

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

export function Arpeggios() {
  const { canPersist } = useAuthAccess();
  const drill = useArpeggios(canPersist);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const {
    midiSupported,
    midiConnected,
    midiInputs,
    selectedInputId,
    setSelectedInputId,
    connectMidi,
    heldNotes,

    chord,
    progressText,

    phase,
    targetIdx,
    lapCount,
    missCount,
    missesThisLap,
    liveMs,
    recentHistory,
    flash,
    successFlash,
    countdownValue,
    breakRemaining,
    restartChord,
    nextChord,

    flashOnMiss,
    setFlashOnMiss,
    showLh,
    setShowLh,
    lapChime,
    setLapChime,
    config,
    toggleChordIncluded,
    moveChord,
    resetOrder,
    ignoredPcs,
    toggleIgnoredPc,
    setIgnoredPcs,

    ankiFollow,
    setAnkiFollow,
    ankiStatus,
    deckStats,
    autoTimer,
    setAutoTimer,
    hideChordUntilGo,
    setHideChordUntilGo,
    countdownSeconds,
    setCountdownSeconds,
    breakSeconds,
    setBreakSeconds,
    breakTickSound,
    setBreakTickSound,
    autoGrade,
    setAutoGrade,
    missThresholds,
    setGoodMisses,
    setHardMisses,
    gradeStatus,
    lastGradeResult,
  } = drill;

  const masked = hideChordUntilGo && phase === "countdown" && ankiFollow;

  const target = chord?.rh[targetIdx];
  const targetLabel =
    phase === "countdown"
      ? `Get ready — chord in ${countdownValue}…`
      : phase === "complete"
      ? "✓ Lap complete"
      : phase === "sequence"
      ? `next (${target?.deg ?? ""})`
      : showLh
      ? "play the root + 5th to begin"
      : "play the LH pedal";

  const targetNote =
    phase === "countdown"
      ? String(countdownValue)
      : phase === "complete"
      ? chord?.id ?? "—"
      : phase === "sequence"
      ? target?.name ?? "—"
      : showLh
      ? chord?.lh.map((n) => n.name).join(" + ") ?? "—"
      : "LH pedal";

  return (
    <div className="space-y-6" data-testid="arpeggios-drill">
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
          <CardTitle className="font-heading text-base">Sequence</CardTitle>
          <CardDescription>
            Customize which minor-11th cells are included and their order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCustomizeOpen((v) => !v)}
            data-testid="customize-sequence-btn"
          >
            {customizeOpen ? "Done" : "Customize chords & order"}
          </Button>

          {customizeOpen && (
            <div className="mt-4 space-y-3 rounded-lg border border-border p-3">
              <div className="space-y-2">
                {config.order.map((id, i) => {
                  const excluded = config.excluded.includes(id);
                  return (
                    <div
                      key={id}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5",
                        excluded && "opacity-50"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={!excluded}
                        onChange={() => toggleChordIncluded(id)}
                        className="h-4 w-4"
                      />
                      <span className="flex-1 text-sm font-medium">{id}</span>
                      <button
                        disabled={i === 0}
                        onClick={() => moveChord(id, "up")}
                        className="rounded-md p-1 hover:bg-muted disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        disabled={i === config.order.length - 1}
                        onClick={() => moveChord(id, "down")}
                        className="rounded-md p-1 hover:bg-muted disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <Button variant="ghost" size="sm" onClick={resetOrder}>
                Reset to default order
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
              phase === "sequence"
                ? "bg-primary/10 text-primary"
                : phase === "complete"
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            {progressText}
          </div>

          <div
            className={cn(
              "font-heading text-5xl font-semibold tracking-tight transition-all",
              masked ? "text-muted-foreground blur-sm" : "text-foreground"
            )}
            data-testid="arpeggio-chord-name"
          >
            {masked ? "????" : chord?.id ?? "—"}
          </div>

          <div
            className={cn(
              "font-mono text-lg tracking-wide",
              showLh && !masked ? "opacity-100" : "opacity-0"
            )}
            data-testid="arpeggio-lh-notes"
          >
            {masked ? "" : chord ? `LH pedal (hold): ${chord.lh.map((n) => n.name).join(" + ")}` : ""}
          </div>

          <div className="space-y-2">
            <div
              className={cn(
                "text-xs font-medium uppercase tracking-wider text-muted-foreground",
                flash && "text-destructive",
                successFlash && "text-success"
              )}
            >
              {targetLabel}
            </div>
            <div
              className={cn(
                "font-heading text-6xl font-semibold transition-colors",
                flash && "text-destructive",
                successFlash && "text-success"
              )}
              data-testid="arpeggio-target-note"
            >
              {masked ? "????" : targetNote}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2" data-testid="arpeggio-cell-strip">
            {chord?.rh.map((note, i) => {
              const isCurrent = i === targetIdx && phase === "sequence";
              const isDone = phase === "complete" || (phase === "sequence" && i < targetIdx);
              return (
                <span
                  key={`${note.name}-${i}`}
                  className={cn(
                    "rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors",
                    isCurrent
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : isDone
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {note.deg} {note.name}
                </span>
              );
            })}
          </div>

          <div className="font-mono text-3xl font-medium tabular-nums">
            {phase === "countdown"
              ? countdownValue
              : phase === "sequence"
              ? `${(liveMs / 1000).toFixed(2)}s`
              : "—"}
          </div>

          <div className="text-sm text-muted-foreground">
            {heldNotes.length > 0
              ? `Holding: ${heldNotes.map((n) => {
                  const pcs = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
                  return pcs[n % 12];
                }).join(" ")}`
              : "No keys held"}
          </div>

          {breakRemaining > 0 && (
            <div className="text-sm font-medium text-muted-foreground">
              Grading in {breakRemaining}…
            </div>
          )}

          <div className="grid w-full max-w-md grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Laps</div>
              <div className="font-mono text-lg font-medium">{lapCount}</div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Misses</div>
              <div className="font-mono text-lg font-medium">{missCount}</div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">This lap</div>
              <div className="font-mono text-lg font-medium">{missesThisLap}</div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={restartChord} data-testid="restart-chord-btn">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restart chord
            </Button>
            <Button onClick={nextChord} data-testid="next-chord-btn">
              Next chord →
            </Button>
          </div>

          {recentHistory.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {recentHistory
                .map((h) => `${h.from}→${h.to} ${(h.ms / 1000).toFixed(2)}s`)
                .join("  ·  ")}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">Settings</CardTitle>
          <CardDescription>Configure how the drill behaves.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <SettingRow
            label="Flash on Miss"
            tooltip="Briefly flash the target red when a wrong note is played."
          >
            <ToggleGroup
              value={flashOnMiss}
              onChange={setFlashOnMiss}
              options={[
                { label: "Off", value: false },
                { label: "On", value: true },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Show LH notes"
            tooltip="Show the left-hand pedal notes for the current chord."
          >
            <ToggleGroup
              value={showLh}
              onChange={setShowLh}
              options={[
                { label: "Off", value: false },
                { label: "On", value: true },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Lap Chime"
            tooltip="Play a short chime each time a full lap is completed."
          >
            <ToggleGroup
              value={lapChime}
              onChange={setLapChime}
              options={[
                { label: "Off", value: false },
                { label: "On", value: true },
              ]}
            />
          </SettingRow>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Miss filter</div>
                <div className="text-xs text-muted-foreground">
                  Selected notes never count as misses during the sequence.
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setIgnoredPcs(chord?.lh.map((n) => n.pc) ?? [])
                  }
                  disabled={!chord}
                >
                  Use root chord
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIgnoredPcs([])}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-12">
              {SHARP_NAMES.map((name, pc) => {
                const active = ignoredPcs.includes(pc);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleIgnoredPc(pc)}
                    className={cn(
                      "rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                    aria-pressed={active}
                    data-testid={`miss-filter-pc-${pc}`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={cn(
              "space-y-5 rounded-lg border p-4",
              ankiFollow ? "border-border" : "border-dashed border-border/50 opacity-75"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Anki Sync</div>
                <div className="text-xs text-muted-foreground">{ankiStatus}</div>
              </div>
              <ToggleGroup
                value={ankiFollow}
                onChange={setAnkiFollow}
                options={[
                  { label: "Off", value: false },
                  { label: "Follow card", value: true },
                ]}
              />
            </div>

            {ankiFollow && deckStats && deckStats.new !== null && (
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "new", value: deckStats.new, cls: "bg-blue-500/10 text-blue-500" },
                  { label: "learning", value: deckStats.learn, cls: "bg-orange-500/10 text-orange-500" },
                  { label: "review", value: deckStats.review, cls: "bg-green-500/10 text-green-500" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      s.cls
                    )}
                  >
                    <span>{s.value}</span>
                    <span className="opacity-80">{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <SettingRow label="Automatic timer">
                <ToggleGroup
                  value={autoTimer}
                  onChange={setAutoTimer}
                  options={[
                    { label: "Off", value: false },
                    { label: "On", value: true },
                  ]}
                />
              </SettingRow>

              <SettingRow label="Hide until go">
                <ToggleGroup
                  value={hideChordUntilGo}
                  onChange={setHideChordUntilGo}
                  options={[
                    { label: "Off", value: false },
                    { label: "On", value: true },
                  ]}
                />
              </SettingRow>

              <SettingRow label="Countdown seconds">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={countdownSeconds}
                  onChange={(e) => setCountdownSeconds(parseFloat(e.target.value) || 3)}
                  className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring"
                />
              </SettingRow>

              <SettingRow label="Break before grading">
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={breakSeconds}
                  onChange={(e) => setBreakSeconds(parseFloat(e.target.value) || 0)}
                  className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring"
                />
              </SettingRow>

              <SettingRow label="Break tick sound">
                <ToggleGroup
                  value={breakTickSound}
                  onChange={setBreakTickSound}
                  options={[
                    { label: "Muted", value: false },
                    { label: "On", value: true },
                  ]}
                />
              </SettingRow>

              <SettingRow label="Auto-grade">
                <ToggleGroup
                  value={autoGrade}
                  onChange={setAutoGrade}
                  options={[
                    { label: "Off", value: false },
                    { label: "On", value: true },
                  ]}
                />
              </SettingRow>
            </div>

            {autoGrade && (
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingRow label="Good ≤ misses">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    step={1}
                    value={missThresholds.good}
                    onChange={(e) => setGoodMisses(parseInt(e.target.value, 10) || 0)}
                    className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring"
                  />
                </SettingRow>
                <SettingRow label="Hard ≤ misses">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    step={1}
                    value={missThresholds.hard}
                    onChange={(e) => setHardMisses(parseInt(e.target.value, 10) || 0)}
                    className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring"
                  />
                </SettingRow>
              </div>
            )}

            {autoGrade && (
              <div className="flex justify-center">
                {gradeStatus === "pending" ? (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Sending to Anki…
                  </span>
                ) : lastGradeResult ? (
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      GRADE_COLORS[lastGradeResult.grade]
                    )}
                  >
                    Last sent: {lastGradeResult.grade} ({lastGradeResult.misses} miss
                    {lastGradeResult.misses === 1 ? "" : "es"})
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    No grade sent yet
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
