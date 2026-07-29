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
  clearLocalRootCycleByGroup,
  listLocalRootCycleEvents,
} from "@/lib/local-practice-history";
import { Loader2 } from "lucide-react";

function rcGroupKey(
  mode: string,
  quality?: string,
  fromDeg?: string,
  toDeg?: string
) {
  if (mode === "chord") {
    return `Chord · ${quality ?? ""}`;
  }
  return `Arpeggio · ${fromDeg ?? ""}→${toDeg ?? ""}`;
}

export function RootCyclingPanel() {
  const { canPersist } = useAuthAccess();
  const localVersion = useLocalPracticeHistoryVersion();
  const liveEvents = useQuery(
    api.tracking.listRootCycleEvents,
    canPersist ? {} : "skip"
  );
  const clearMutation = useMutation(api.tracking.clearRootCycleEventsByGroup);
  const localEvents = useMemo(
    () => (canPersist ? undefined : listLocalRootCycleEvents()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canPersist, localVersion]
  );
  const { data: cachedEvents, isLoading, clear: clearCache } =
    useCachedTrackingQuery("rootCycleEvents", liveEvents);
  const events = canPersist ? cachedEvents : localEvents;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const groups = useMemo(() => {
    const eventsList = events ?? [];
    const map = new Map<string, typeof eventsList>();
    for (const e of eventsList) {
      const k = rcGroupKey(e.mode ?? "", e.quality, e.fromDeg, e.toDeg);
      const list = map.get(k) ?? [];
      list.push(e);
      map.set(k, list);
    }
    return new Map(
      [...map.entries()].sort((a, b) => {
        const la = a[1][a[1].length - 1].timestamp;
        const lb = b[1][b[1].length - 1].timestamp;
        return lb - la;
      })
    );
  }, [events]);

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
        label: e.root ?? "",
      }));
  }, [groups, activeKey]);

  const rootBreakdown = useMemo(() => {
    const list = groups.get(activeKey) ?? [];
    if (!list.length) return null;
    const counts = new Map<string, number>();
    for (const e of list) {
      if (e.root) counts.set(e.root, (counts.get(e.root) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([root, count]) => `${root} (×${count})`)
      .join(", ");
  }, [groups, activeKey]);

  async function handleClear() {
    if (!activeKey) return;
    const mode = activeKey.startsWith("Chord") ? "chord" : "arpeggio";
    let quality: string | undefined;
    let fromDeg: string | undefined;
    let toDeg: string | undefined;
    if (mode === "chord") {
      quality = activeKey.slice("Chord · ".length);
    } else {
      const transition = activeKey.slice("Arpeggio · ".length);
      [fromDeg, toDeg] = transition.split("→");
    }
    if (canPersist) {
      await clearMutation({ mode, quality, fromDeg, toDeg });
      clearCache();
    } else {
      clearLocalRootCycleByGroup({ mode, quality, fromDeg, toDeg });
    }
    setSelectedKey(null);
  }

  if (canPersist && isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
        Loading your root cycling history…
      </div>
    );
  }

  if (!(events ?? []).length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No Root Cycling attempts logged yet.
        <br />
        Play a few rounds on the Root Cycling tab to start building this.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit max-h-[640px] overflow-y-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Ideas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {keys.map((key) => {
            const entries = groups.get(key)!;
            const last = entries[entries.length - 1];
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
                  {entries.length} · {(last.reactionTimeMs / 1000).toFixed(2)}s
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
              ? `${chartData.length} attempt${chartData.length === 1 ? "" : "s"} recorded`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrackingChart data={chartData} emptyMessage="No attempts logged for this yet." />
          {rootBreakdown && (
            <p className="mt-4 text-sm text-muted-foreground">
              <span className="text-foreground">Roots practiced:</span> {rootBreakdown}
            </p>
          )}
          {activeKey && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 text-muted-foreground hover:text-destructive"
              onClick={handleClear}
            >
              Clear this log
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
