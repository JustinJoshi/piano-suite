"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrackingChart } from "./tracking-chart";
import { cn } from "@/lib/utils";
import { useCachedTrackingQuery } from "@/hooks/useCachedTrackingQuery";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { useLocalPracticeHistoryVersion } from "@/hooks/useLocalPracticeHistory";
import {
  clearLocalChordDrillByChord,
  listLocalChordDrillEvents,
} from "@/lib/local-practice-history";
import { Loader2 } from "lucide-react";

export function ChordDrillPanel() {
  const { canPersist } = useAuthAccess();
  const localVersion = useLocalPracticeHistoryVersion();
  const liveEvents = useQuery(
    api.tracking.listChordDrillEvents,
    canPersist ? {} : "skip"
  );
  const clearMutation = useMutation(api.tracking.clearChordDrillEventsByChord);
  const localEvents = useMemo(
    () => (canPersist ? undefined : listLocalChordDrillEvents()),
    // localVersion forces a re-read after Free-tier drill writes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canPersist, localVersion]
  );
  const { data: cachedEvents, isLoading, clear: clearCache } =
    useCachedTrackingQuery("chordDrillEvents", liveEvents);
  type ChordRow = {
    _id: string;
    chord?: string;
    reactionTimeMs: number;
    grade?: string;
    redo: boolean;
    timestamp: number;
  };
  const events: ChordRow[] | undefined = canPersist
    ? cachedEvents
    : localEvents;
  const [selectedChord, setSelectedChord] = useState<string | null>(null);

  const groups = useMemo(() => {
    const eventsList = events ?? [];
    const map = new Map<string, ChordRow[]>();
    for (const e of eventsList) {
      if (!e.chord) continue;
      const list = map.get(e.chord) ?? [];
      list.push(e);
      map.set(e.chord, list);
    }
    // Sort chords by most recent attempt first
    return new Map(
      [...map.entries()].sort((a, b) => {
        const la = a[1][a[1].length - 1].timestamp;
        const lb = b[1][b[1].length - 1].timestamp;
        return lb - la;
      })
    );
  }, [events]);

  const chords = useMemo(() => [...groups.keys()], [groups]);

  const activeChord = selectedChord && groups.has(selectedChord) ? selectedChord : chords[0] ?? null;

  const chartData = useMemo(() => {
    const list = groups.get(activeChord) ?? [];
    return list
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((e, i) => ({
        attempt: i + 1,
        seconds: e.reactionTimeMs / 1000,
        ms: e.reactionTimeMs,
        grade: e.grade,
        redo: e.redo,
        date: new Date(e.timestamp),
        label: e.chord ?? "",
      }));
  }, [groups, activeChord]);

  async function handleClear() {
    if (!activeChord) return;
    if (canPersist) {
      await clearMutation({ chord: activeChord });
      clearCache();
    } else {
      clearLocalChordDrillByChord(activeChord);
    }
    setSelectedChord(null);
  }

  if (canPersist && isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
        Loading your chord drill history…
      </div>
    );
  }

  if (!(events ?? []).length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No first-chord attempts logged yet.
        <br />
        Play a round on the Chord Drill tab to start building this.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]" data-testid="tracking-panel">
      <Card className="h-fit max-h-[640px] overflow-y-auto" data-testid="tracking-list">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Chords
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {chords.map((chord) => {
            const entries = groups.get(chord)!;
            const last = entries[entries.length - 1];
            return (
              <button
                key={chord}
                onClick={() => setSelectedChord(chord)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  activeChord === chord
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span className="font-medium">{chord}</span>
                <span className="text-xs opacity-80">
                  {entries.length} · {(last.reactionTimeMs / 1000).toFixed(2)}s
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card data-testid="tracking-chart">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg">{activeChord ?? "—"}</CardTitle>
          <CardDescription>
            {chartData.length
              ? `${chartData.length} first-chord attempt${chartData.length === 1 ? "" : "s"} recorded`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrackingChart
            data={chartData}
            emptyMessage="No attempts logged for this chord yet."
          />
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-grade-again" /> Again
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-grade-hard" /> Hard
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-grade-good" /> Good
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-grade-easy" /> Easy
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-grade-ungraded" /> Ungraded
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full border-2 border-grade-good" /> Redo
            </span>
          </div>
          {activeChord && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 text-muted-foreground hover:text-destructive"
              onClick={handleClear}
            >
              Clear this chord&apos;s log
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
