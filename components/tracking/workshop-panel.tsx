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
  clearLocalWorkshopByPage,
  listLocalWorkshopEvents,
} from "@/lib/local-practice-history";
import { Loader2 } from "lucide-react";

type WorkshopRow = {
  _id: string;
  pageId: string;
  chord: string;
  reactionTimeMs: number;
  grade?: string;
  timestamp: number;
};

function formatPageLabel(pageId: string): string {
  if (!pageId || pageId === "default") return "My Practice Page";
  if (pageId.length > 16) return `${pageId.slice(0, 14)}…`;
  return pageId;
}

export function WorkshopPanel() {
  const { canPersist } = useAuthAccess();
  const localVersion = useLocalPracticeHistoryVersion();
  const liveEvents = useQuery(
    api.tracking.listPracticeEventsByTool,
    canPersist ? { tool: "workshop" } : "skip"
  );
  const clearMutation = useMutation(api.tracking.clearPracticeEventsByPage);
  const localEvents = useMemo(
    () => (canPersist ? undefined : listLocalWorkshopEvents()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canPersist, localVersion]
  );
  const { data: cachedEvents, isLoading, clear: clearCache } =
    useCachedTrackingQuery("workshopEvents", liveEvents);

  const events = (canPersist ? cachedEvents : localEvents) as WorkshopRow[] | undefined;
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, WorkshopRow[]>();
    for (const e of events ?? []) {
      const list = map.get(e.pageId) ?? [];
      list.push(e);
      map.set(e.pageId, list);
    }
    return new Map(
      [...map.entries()].sort((a, b) => {
        const la = a[1][a[1].length - 1]?.timestamp ?? 0;
        const lb = b[1][b[1].length - 1]?.timestamp ?? 0;
        return lb - la;
      })
    );
  }, [events]);

  const pageIds = useMemo(() => [...groups.keys()], [groups]);
  const activePageId =
    (selectedPageId && groups.has(selectedPageId) ? selectedPageId : pageIds[0]) ?? null;

  const chartData = useMemo(() => {
    const list = groups.get(activePageId) ?? [];
    return list
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((e, i) => ({
        attempt: i + 1,
        seconds: e.reactionTimeMs / 1000,
        ms: e.reactionTimeMs,
        grade: e.grade,
        redo: false,
        date: new Date(e.timestamp),
        label: e.chord,
      }));
  }, [groups, activePageId]);

  async function handleClear() {
    if (!activePageId) return;
    if (canPersist) {
      await clearMutation({ tool: "workshop", pageId: activePageId });
      clearCache();
    } else {
      clearLocalWorkshopByPage(activePageId);
    }
    setSelectedPageId(null);
  }

  if (canPersist && isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
        Loading your workshop history…
      </div>
    );
  }

  if (!(events ?? []).length) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No workshop attempts logged yet.
        <br />
        Build a page in the Workshop and practice a chord set to start tracking.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="h-fit max-h-[640px] overflow-y-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Practice pages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {pageIds.map((pageId) => {
            const entries = groups.get(pageId)!;
            const last = entries[entries.length - 1];
            return (
              <button
                key={pageId}
                onClick={() => setSelectedPageId(pageId)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  activePageId === pageId
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <span className="font-medium">{formatPageLabel(pageId)}</span>
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
          <CardTitle className="font-heading text-lg">
            {formatPageLabel(activePageId ?? "")}
          </CardTitle>
          <CardDescription>
            {chartData.length
              ? `${chartData.length} target attempt${chartData.length === 1 ? "" : "s"} recorded`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrackingChart
            data={chartData}
            emptyMessage="No attempts logged for this page yet."
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
          </div>
          {activePageId && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 text-muted-foreground hover:text-destructive"
              onClick={handleClear}
            >
              Clear this page&apos;s log
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
