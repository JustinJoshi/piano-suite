"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MidiConnectionBar } from "@/components/drills/midi-connection-bar";
import { useChordDrill } from "@/hooks/useChordDrill";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { floatPanelUpgradeCopy } from "@/lib/billing";
import {
  ROOTS,
  QUALITY_GROUPS,
  SINGLE_QUALITIES,
  REP_TARGETS,
} from "@/lib/music-theory";
import { cn } from "@/lib/utils";
import { Shuffle, RotateCcw } from "lucide-react";

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

function Confetti({ trigger }: { trigger: number }) {
  if (trigger === 0) return null;
  return (
    <canvas
      data-testid="confetti-canvas"
      className="pointer-events-none fixed inset-0 z-50"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

function PerChordRepsModal({
  open,
  onClose,
  perChordReps,
  onChange,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  perChordReps: Record<string, number>;
  onChange: (chordKey: string, value: number | null) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});

  if (!open) return null;

  const rows: { chordKey: string; root: string; suffix: string }[] = [];
  for (const root of ROOTS) {
    for (const q of SINGLE_QUALITIES) {
      rows.push({ chordKey: `${root.name}${q.suffix}`, root: root.name, suffix: q.suffix });
    }
  }

  const filtered = rows.filter((r) =>
    r.chordKey.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    for (const [chordKey, raw] of Object.entries(draft)) {
      if (raw.trim() === "") {
        onChange(chordKey, null);
      } else {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n) && n >= 1 && n <= 999) {
          onChange(chordKey, n);
        }
      }
    }
    setDraft({});
    onClose();
  };

  const count = Object.keys(perChordReps).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="per-chord-reps-modal"
    >
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold">Per-chord reps</h3>
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <input
          type="text"
          placeholder="Search chords…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
        />

        <div className="-mx-4 flex-1 overflow-y-auto px-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {filtered.map(({ chordKey }) => {
              const val =
                draft[chordKey] ??
                (perChordReps[chordKey] !== undefined ? String(perChordReps[chordKey]) : "");
              return (
                <div key={chordKey} className="flex items-center gap-2">
                  <span className="w-16 text-xs text-muted-foreground">{chordKey}</span>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={val}
                    placeholder="def"
                    onChange={(e) => setDraft((d) => ({ ...d, [chordKey]: e.target.value }))}
                    className="w-16 rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-ring"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">
            {count} chord{count === 1 ? "" : "s"} have custom reps.
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear all
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChordDrill() {
  const { canPersist, canUseFloatPanel } = useAuthAccess();
  const drill = useChordDrill(canPersist);
  const [perChordModalOpen, setPerChordModalOpen] = useState(false);

  const {
    midiSupported,
    midiConnected,
    midiInputs,
    selectedInputId,
    setSelectedInputId,
    connectMidi,
    heldNotesDisplay,
    mode,
    setMode,
    root,
    setRoot,
    qualityIdx,
    setQualityIdx,
    symbol,
    chordNotes,
    familyList,
    phase,
    liveMs,
    countdownValue,
    breakRemaining,
    running,
    justCompleted,
    repCount,
    repTarget,
    currentRepTarget,
    setRepTarget,
    repTimes,
    startDrill,
    stopDrill,
    nextChord,
    redoChord,
    history,
    resetStats,
    showNotes,
    setShowNotes,
    revealNotesOnFinish,
    setRevealNotesOnFinish,
    requireExactNotes,
    setRequireExactNotes,
    celebrateGood,
    setCelebrateGood,
    perChordRepsEnabled,
    setPerChordRepsEnabled,
    perChordReps,
    setPerChordRep,
    clearPerChordReps,
    showNewNotes,
    setShowNewNotes,
    newCardRepBoost,
    setNewCardRepBoost,
    newCardRepTarget,
    setNewCardRepTarget,
    currentCardQueue,
    ankiFollow,
    setAnkiFollow,
    ankiStatus,
    deckStats,
    autoTimer,
    setAutoTimer,
    countdownSeconds,
    setCountdownSeconds,
    hideChordUntilGo,
    setHideChordUntilGo,
    startCountdownEnabled,
    setStartCountdownEnabled,
    breakSeconds,
    setBreakSeconds,
    breakTickSound,
    setBreakTickSound,
    autoGrade,
    setAutoGrade,
    gradeThresholds,
    setGoodThreshold,
    setHardThreshold,
    gradeStatus,
    lastGradeResult,
    confettiKey,
    shuffleChord,
  } = drill;

  const stats = history[symbol];

  const masked =
    hideChordUntilGo && phase === "countdown" && ankiFollow && ankiStatus.startsWith("Following:");

  const forceReveal = revealNotesOnFinish && justCompleted;
  const newCardReveal = showNewNotes && currentCardQueue === "new";
  const notesVisible = !masked && (showNotes || forceReveal || newCardReveal);

  const phaseLabel = useMemo(() => {
    if (phase === "idle") return "Press Start, then lift your hands off the keys";
    if (phase === "countdown") return `Get ready — chord in ${countdownValue}…`;
    if (phase === "armed") return "Lift your hands fully off the keys";
    if (phase === "timing") return "Play it…";
    if (phase === "success") return "✓ Nice";
    if (phase === "break-before-grade") return "Round complete";
    return "Finished";
  }, [phase, countdownValue]);

  const currentPerChordOverride = perChordRepsEnabled
    ? perChordReps[symbol] ?? null
    : null;

  return (
    <div className="space-y-6" data-testid="chord-drill">
      <Confetti trigger={confettiKey} />

      <MidiConnectionBar
        supported={midiSupported}
        connected={midiConnected}
        error={null}
        inputs={midiInputs}
        selectedInputId={selectedInputId}
        onSelectInput={setSelectedInputId}
        onConnect={connectMidi}
      />

      {!canUseFloatPanel ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid="chord-drill-float-teaser"
        >
          {floatPanelUpgradeCopy("chord-drill")}{" "}
          <Link
            href="/pricing"
            className="text-primary underline-offset-2 hover:underline"
          >
            See plans
          </Link>
        </p>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "single", label: "Single Shape" },
              { id: "family", label: "Family Cycle" },
              { id: "extended", label: "Extended Family" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as typeof mode)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === m.id
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Root</div>
            <div className="flex flex-wrap gap-1.5">
              {ROOTS.map((r) => (
                <button
                  key={r.pc}
                  onClick={() => setRoot(r)}
                  className={cn(
                    "h-8 w-10 rounded-lg border text-sm font-medium transition-colors",
                    root.pc === r.pc
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {mode === "single" && (
            <div className="space-y-4">
              {QUALITY_GROUPS.map((group) => (
                <div key={group.label} className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.qualities.map((q) => {
                      const globalIdx = SINGLE_QUALITIES.findIndex(
                        (sq) => sq.suffix === q.suffix
                      );
                      return (
                        <button
                          key={q.suffix}
                          onClick={() => setQualityIdx(globalIdx)}
                          className={cn(
                            "rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors",
                            qualityIdx === globalIdx
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          )}
                        >
                          {q.suffix}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(mode === "family" || mode === "extended") && (
            <div className="flex flex-wrap gap-2">
              {familyList.map((q, i) => (
                <div
                  key={q.suffix}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    i === qualityIdx
                      ? "bg-primary text-primary-foreground"
                      : i < qualityIdx
                      ? "bg-muted text-muted-foreground"
                      : "border border-border text-muted-foreground"
                  )}
                >
                  {q.suffix}
                </div>
              ))}
            </div>
          )}
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
            className={cn(
              "font-heading text-6xl font-semibold tracking-tight transition-all",
              masked ? "text-muted-foreground blur-sm" : "text-foreground"
            )}
            data-testid="chord-symbol"
          >
            {masked ? "????" : symbol}
          </div>

          <div
            className={cn(
              "font-mono text-xl tracking-wide transition-all",
              notesVisible ? "opacity-100" : "opacity-0",
              masked ? "blur-sm" : ""
            )}
            data-testid="chord-notes"
          >
            {masked ? "" : chordNotes.join("  ·  ")}
          </div>

          <div className="font-mono text-3xl font-medium tabular-nums">
            {phase === "countdown"
              ? countdownValue
              : phase === "timing"
              ? `${(liveMs / 1000).toFixed(2)}s`
              : "—"}
          </div>

          <div className="text-sm text-muted-foreground">
            {heldNotesDisplay.length > 0
              ? `Holding: ${heldNotesDisplay.join(" ")}`
              : "No keys held"}
          </div>

          {breakRemaining > 0 && (
            <div className="text-sm font-medium text-muted-foreground">
              Grading in {breakRemaining}…
            </div>
          )}

          <div className="w-full max-w-md space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {repCount} / {currentRepTarget} reps
                {perChordRepsEnabled && currentPerChordOverride !== null
                  ? ` (${symbol} custom)`
                  : newCardRepBoost && currentCardQueue === "new" && currentRepTarget !== repTarget
                  ? " (new card boost)"
                  : ""}
              </span>
              {repTimes.length > 0 && (
                <span>first chord {(repTimes[0] / 1000).toFixed(2)}s</span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.min(repCount / currentRepTarget, 1) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {!running && !justCompleted && (
              <Button
                onClick={startDrill}
                disabled={!midiConnected}
                data-testid="start-drill-btn"
              >
                {midiConnected ? "Start Drill" : "Connect MIDI first"}
              </Button>
            )}

            {running && (
              <Button variant="secondary" onClick={stopDrill} data-testid="stop-drill-btn">
                Stop
              </Button>
            )}

            {justCompleted && (
              <>
                <Button variant="outline" onClick={redoChord} data-testid="redo-btn">
                  Redo
                </Button>
                <Button onClick={nextChord} data-testid="next-btn">
                  {mode === "family" || mode === "extended" ? "Next in family" : "Next chord"}
                </Button>
              </>
            )}

            <Button variant="ghost" size="icon" onClick={shuffleChord} data-testid="shuffle-btn">
              <Shuffle className="h-4 w-4" />
            </Button>
          </div>

          {justCompleted && repTimes.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {currentRepTarget} reps — avg{" "}
              {(
                repTimes.reduce((a, b) => a + b, 0) / repTimes.length / 1000
              ).toFixed(2)}
              s, best {(Math.min(...repTimes) / 1000).toFixed(2)}s, first chord{" "}
              {(repTimes[0] / 1000).toFixed(2)}s
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
          <div className="space-y-2">
            <div className="text-sm font-medium">Reps per round</div>
            <div className="flex flex-wrap items-center gap-2">
              {REP_TARGETS.map((n) => (
                <button
                  key={n}
                  onClick={() => setRepTarget(n)}
                  className={cn(
                    "h-8 w-10 rounded-lg border text-sm font-medium transition-colors",
                    repTarget === n
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                min={1}
                max={999}
                value={repTarget}
                onChange={(e) => setRepTarget(parseInt(e.target.value, 10) || 1)}
                className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring"
                data-testid="rep-custom-input"
              />
            </div>
          </div>

          <SettingRow label="Chord notes" tooltip="Show or hide the notes in the chord.">
            <ToggleGroup
              value={showNotes}
              onChange={setShowNotes}
              options={[
                { label: "Show", value: true },
                { label: "Hide", value: false },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Reveal on finish"
            tooltip="Briefly reveal notes when a round completes."
          >
            <ToggleGroup
              value={revealNotesOnFinish}
              onChange={setRevealNotesOnFinish}
              options={[
                { label: "Off", value: false },
                { label: "On", value: true },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Require exact notes"
            tooltip="Fail if any extra notes are held beyond the target chord."
          >
            <ToggleGroup
              value={requireExactNotes}
              onChange={setRequireExactNotes}
              options={[
                { label: "Off", value: false },
                { label: "On", value: true },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Celebrate Good"
            tooltip="Confetti burst when first-chord time beats the Good threshold."
          >
            <ToggleGroup
              value={celebrateGood}
              onChange={setCelebrateGood}
              options={[
                { label: "Off", value: false },
                { label: "On", value: true },
              ]}
            />
          </SettingRow>

          <SettingRow label="Per-chord reps" tooltip="Assign a custom rep count to any chord.">
            <div className="flex items-center gap-3" data-testid="per-chord-reps-row">
              <ToggleGroup
                value={perChordRepsEnabled}
                onChange={setPerChordRepsEnabled}
                options={[
                  { label: "Off", value: false },
                  { label: "On", value: true },
                ]}
              />
              {perChordRepsEnabled && (
                <>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    placeholder={String(currentRepTarget)}
                    value={currentPerChordOverride ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "" || raw.trim() === "") {
                        setPerChordRep(symbol, null);
                      } else {
                        const n = parseInt(raw, 10);
                        if (!Number.isNaN(n)) setPerChordRep(symbol, n);
                      }
                    }}
                    className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring"
                    data-testid="per-chord-current-input"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPerChordModalOpen(true)}
                    data-testid="manage-per-chord-reps-btn"
                  >
                    Manage…
                  </Button>
                </>
              )}
            </div>
          </SettingRow>

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

              <SettingRow label="Start countdown">
                <ToggleGroup
                  value={startCountdownEnabled}
                  onChange={setStartCountdownEnabled}
                  options={[
                    { label: "Off", value: false },
                    { label: "On", value: true },
                  ]}
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
                <SettingRow label="Good threshold (s)">
                  <input
                    type="number"
                    min={0.1}
                    max={30}
                    step={0.1}
                    value={(gradeThresholds.good / 1000).toFixed(1)}
                    onChange={(e) => setGoodThreshold(parseFloat(e.target.value) * 1000)}
                    className="h-8 w-24 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring"
                  />
                </SettingRow>
                <SettingRow label="Hard threshold (s)">
                  <input
                    type="number"
                    min={0.2}
                    max={60}
                    step={0.1}
                    value={(gradeThresholds.hard / 1000).toFixed(1)}
                    onChange={(e) => setHardThreshold(parseFloat(e.target.value) * 1000)}
                    className="h-8 w-24 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring"
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
                    Last sent: {lastGradeResult.grade} ({(lastGradeResult.ms / 1000).toFixed(2)}s)
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    No grade sent yet
                  </span>
                )}
              </div>
            )}

            <SettingRow
              label="Show new notes"
              tooltip="Reveal notes for Anki cards marked as new even when Chord Notes is hidden."
            >
              <ToggleGroup
                value={showNewNotes}
                onChange={setShowNewNotes}
                options={[
                  { label: "Off", value: false },
                  { label: "On", value: true },
                ]}
              />
            </SettingRow>

            <SettingRow
              label="New card rep boost"
              tooltip="Use a higher rep count for brand-new Anki cards."
            >
              <div className="flex items-center gap-3">
                <ToggleGroup
                  value={newCardRepBoost}
                  onChange={setNewCardRepBoost}
                  options={[
                    { label: "Off", value: false },
                    { label: "On", value: true },
                  ]}
                />
                {newCardRepBoost && (
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={newCardRepTarget}
                    onChange={(e) => setNewCardRepTarget(parseInt(e.target.value, 10) || 1)}
                    className="h-8 w-20 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-ring"
                  />
                )}
              </div>
            </SettingRow>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">Personal bests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Best single</div>
              <div className="font-mono text-lg font-medium">
                {stats && isFinite(stats.bestSingleMs)
                  ? `${(stats.bestSingleMs / 1000).toFixed(2)}s`
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
              <div className="text-xs text-muted-foreground">Total reps</div>
              <div className="font-mono text-lg font-medium">
                {stats ? stats.totalReps : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">Best first chord</div>
              <div className="font-mono text-lg font-medium">
                {stats && isFinite(stats.bestFirstPressMs)
                  ? `${(stats.bestFirstPressMs / 1000).toFixed(2)}s`
                  : "—"}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-muted-foreground hover:text-destructive"
            onClick={resetStats}
            data-testid="reset-stats-btn"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Clear stats for {symbol}
          </Button>
        </CardContent>
      </Card>

      <PerChordRepsModal
        open={perChordModalOpen}
        onClose={() => setPerChordModalOpen(false)}
        perChordReps={perChordReps}
        onChange={setPerChordRep}
        onClear={clearPerChordReps}
      />
    </div>
  );
}
