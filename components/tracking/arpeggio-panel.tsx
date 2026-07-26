"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrackingChart } from "./tracking-chart";
import { cn } from "@/lib/utils";

function transitionKey(chord: string, fromDeg: string, toDeg: string) {
  return `${chord} · ${fromDeg}→${toDeg}`;
}

export function ArpeggioPanel() {
  const rawEvents = useQuery(api.tracking.listArpeggioEvents);
  const rawMisses = useQuery(api.tracking.listArpeggioMissEvents);
  const clear = useMutation(api.tracking.clearArpeggioEventsByTransition);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const groups = useMemo(() => {
    const events = rawEvents ?? [];
    const misses = rawMisses ?? [];
    const map = new Map<string, typeof events>();
    for (const e of events) {
      if (!e.chord || !e.fromDeg || !e.toDeg) continue;
      const k = transitionKey(e.chord, e.fromDeg, e.toDeg);
      const list = map.get(k) ?? [];
      list.push(e);
      map.set(k, list);
    }
    // Include transitions that only have misses
    for (const m of misses) {
      const k = transitionKey(m.chord, m.fromDeg, m.toDeg);
      if (!map.has(k)) map.set(k, []);
    }
    return new Map(
      [...map.entries()].sort((a, b) => {
        const la = a[1].length ? a[1][a[1].length - 1].timestamp : 0;
        const lb = b[1].length ? b[1][b[1].length - 1].timestamp : 0;
        return lb - la;
      })
    );
  }, [rawEvents, rawMisses]);

  const keys = useMemo(() => [...groups.keys()], [groups]);
  const activeKey = selectedKey && groups.has(selectedKey) ? selectedKey : keys[0] ?? null;

  const chartData = useMemo(() => {
    const list = groups.get(activeKey) ?? [];
    return list
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((e, i) => ({
        attempt: i + 1,
        seconds: e.reactionTimeMs / 1000,
        ms: e.reactionTimeMs,
        grade: null,
        redo: false,
        date: new Date(e.timestamp),
        label: `${e.chord ?? ""} · ${e.fromDeg ?? ""}→${e.toDeg ?? ""}`,
      }));
  }, [groups, activeKey]);

  const missBreakdown = useMemo(() => {
    if (!activeKey) return null;
    const misses = rawMisses ?? [];
    const [chord, transition] = activeKey.split(" · ");
    if (!transition) return null;
    const [fromDeg, toDeg] = transition.split("→");
    const relevant = misses.filter(
      (m) => m.chord === chord && m.fromDeg === fromDeg && m.toDeg === toDeg
    );
    if (!relevant.length) return null;
    const counts = new Map<string, number>();
    for (const m of relevant) {
      counts.set(m.played, (counts.get(m.played) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([note, count]) => `played ${note} instead (×${count})`)
      .join(", ");
  }, [activeKey, rawMisses]);

  async function handleClear() {
    if (!activeKey) return;
    const [chord, transition] = activeKey.split(" · ");
    const [fromDeg, toDeg] = transition.split("→");
    await clear({ chord, fromDeg, toDeg });
    setSelectedKey(null);
  }

  if (!keys.length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No arpeggio attempts logged yet.
        <br />
        Play through a sequence on the Arpeggios tab to start building this.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit max-h-[640px] overflow-y-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Transitions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {keys.map((key) => {
            const entries = groups.get(key)!;
            const misses = rawMisses ?? [];
            const [chord, transition] = key.split(" · ");
            const [fromDeg, toDeg] = transition.split("→");
            const missCount = misses.filter(
              (m) => m.chord === chord && m.fromDeg === fromDeg && m.toDeg === toDeg
            ).length;
            const last = entries.length ? entries[entries.length - 1] : null;
            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  activeKey === key
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span className="font-medium">{key}</span>
                <span className="text-xs opacity-80">
                  {entries.length
                    ? `${entries.length} · ${(last!.reactionTimeMs / 1000).toFixed(2)}s`
                    : "0 attempts"}
                  {missCount > 0 && (
                    <span className="ml-1 text-destructive">{missCount} miss{missCount === 1 ? "" : "es"}</span>
                  )}
                </span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg">{activeKey ?? "—"}</CardTitle>
          <CardDescription>
            {chartData.length
              ? `${chartData.length} successful attempt${chartData.length === 1 ? "" : "s"} recorded`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrackingChart
            data={chartData}
            emptyMessage="No successful attempts logged for this transition yet."
          />
          {missBreakdown && (
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="text-destructive">Miss breakdown:</span> {missBreakdown}
            </p>
          )}
          {activeKey && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 text-muted-foreground hover:text-destructive"
              onClick={handleClear}
            >
              Clear this transition&apos;s log
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
