"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAudio } from "@/hooks/useAudio";
import {
  todayStr,
  computeStreak,
  buildGrid,
  type TechniqueLog,
} from "@/lib/technique";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Square, Check, Flame, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

function sessionsToLog(
  sessions: { date: string; exercise: string; bpm: number; notes?: string }[]
): TechniqueLog {
  const log: TechniqueLog = {};
  for (const s of sessions) {
    log[s.date] = {
      bpm: s.bpm,
      notes: s.notes,
      exercise: s.exercise,
    };
  }
  return log;
}

export function TechniqueTracker() {
  const { ready, startMetronome, stopMetronome, metronomeRunning } = useAudio();
  const sessions = useQuery(api.technique.listTechniqueSessions);
  const logSession = useMutation(api.technique.logTechniqueSession);
  const clearSessions = useMutation(api.technique.clearTechniqueSessions);

  const [exerciseName, setExerciseName] = useState("Czerny 5-Finger Pattern");
  const [bpm, setBpm] = useState(60);
  const [notesToday, setNotesToday] = useState("");
  const [pulse, setPulse] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  const log = useMemo(() => sessionsToLog(sessions ?? []), [sessions]);
  const today = todayStr();
  const streak = useMemo(() => computeStreak(log), [log]);
  const grid = useMemo(() => buildGrid(log, 28), [log]);
  const doneToday = !!log[today];

  const toggleMetronome = useCallback(() => {
    if (metronomeRunning) {
      stopMetronome();
      return;
    }
    startMetronome(bpm, () => setPulse((p) => !p));
  }, [metronomeRunning, stopMetronome, startMetronome, bpm]);

  // Keep the metronome tempo in sync while it is running.
  useEffect(() => {
    if (metronomeRunning) {
      startMetronome(bpm, () => setPulse((p) => !p));
    }
  }, [bpm, metronomeRunning, startMetronome]);

  async function markDoneToday() {
    setSaving(true);
    try {
      await logSession({
        date: today,
        exercise: exerciseName.trim() || "Technique practice",
        bpm,
        notes: notesToday.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Clear all technique history? This cannot be undone.")) {
      return;
    }
    setClearing(true);
    try {
      await clearSessions();
      setExerciseName("Czerny 5-Finger Pattern");
      setBpm(60);
      setNotesToday("");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="exercise"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Exercise
            </label>
            <input
              id="exercise"
              data-testid="exercise-input"
              type="text"
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="e.g. Czerny 5-Finger Pattern"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Metronome
              </label>
              <div className="flex items-center gap-3">
                <div
                  data-testid="pulse-dot"
                  className={cn(
                    "h-3 w-3 rounded-full transition-all duration-100",
                    pulse && metronomeRunning
                      ? "bg-primary shadow-[0_0_12px_2px_rgba(201,162,39,0.6)]"
                      : "bg-muted"
                  )}
                />
                <span data-testid="bpm-display" className="font-heading text-2xl font-semibold">
                  {bpm} BPM
                </span>
              </div>
            </div>
            <input
              data-testid="bpm-slider"
              type="range"
              min={40}
              max={160}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <Button
              data-testid="metronome-btn"
              onClick={toggleMetronome}
              disabled={!ready}
              variant={metronomeRunning ? "destructive" : "default"}
              className="w-full"
            >
              {metronomeRunning ? (
                <>
                  <Square className="h-4 w-4" /> Stop Metronome
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" /> Start Metronome
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Notes (optional)
            </label>
            <input
              id="notes"
              data-testid="notes-input"
              type="text"
              value={notesToday}
              onChange={(e) => setNotesToday(e.target.value)}
              placeholder="e.g. left hand still uneven at 90bpm"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <Button
            data-testid="mark-done-btn"
            onClick={markDoneToday}
            disabled={saving}
            variant="secondary"
            className={cn(
              "w-full border",
              doneToday
                ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                : "border-transparent"
            )}
          >
            <Check className="h-4 w-4" />
            {doneToday
              ? `Logged today at ${log[today]?.bpm} BPM — tap to update`
              : "Mark today done"}
          </Button>
        </CardContent>
      </Card>

      <Card className="flex flex-row items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
          <Flame
            className={cn(
              "h-6 w-6 transition-opacity",
              streak > 0 ? "text-primary opacity-100" : "text-muted-foreground opacity-30"
            )}
          />
        </div>
        <div>
          <div data-testid="streak-number" className="font-heading text-3xl font-semibold">
            {streak}
          </div>
          <div className="text-sm text-muted-foreground">day streak</div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last 28 days</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            data-testid="day-grid"
            className="grid grid-cols-14 gap-1"
            role="img"
            aria-label="28 day practice grid"
          >
            {grid.map((day) => (
              <div
                key={day.date}
                title={day.done ? `${day.date}: ${day.bpm} BPM` : day.date}
                data-testid={day.isToday ? "grid-cell-today" : undefined}
                className={cn(
                  "aspect-square rounded",
                  day.done ? "bg-primary" : "bg-muted",
                  day.isToday && "ring-1 ring-primary outline outline-1 outline-primary outline-offset-1"
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Button
        data-testid="clear-history-btn"
        variant="ghost"
        size="sm"
        onClick={handleClearAll}
        disabled={clearing || !sessions?.length}
        className="mx-auto"
      >
        <RotateCcw className="h-4 w-4" /> Clear all history
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Technique work is a separate track from harmony drilling — finger independence and
        evenness rather than chord recall. A few minutes a day, slow first, tempo up only once
        it&apos;s clean.
      </p>
    </div>
  );
}
