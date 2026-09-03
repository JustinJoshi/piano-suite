"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { useDrillRuntime } from "@/lib/drill-runtime";
import { useLocalPracticeHistoryVersion } from "@/hooks/useLocalPracticeHistory";
import { listLocalWorkshopEvents } from "@/lib/local-practice-history";
import {
  summarizePracticeEvents,
  formatMs,
  GRADE_LABELS,
  EMPTY_SESSION_SUMMARY,
  type PracticeSummaryEvent,
} from "@/lib/session-stats";
import type { SessionStatsConfig } from "@/lib/feature-blocks/session-stats/config";

const GRADE_CLASSES: Record<string, string> = {
  Again: "bg-grade-again",
  Hard: "bg-grade-hard",
  Good: "bg-grade-good",
  Easy: "bg-grade-easy",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-heading text-xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  );
}

/**
 * How this page has been going: reps, speed, and the grade split. Reads
 * Convex history for Pro and browser history for Free, the same split the
 * drill runtime writes with.
 */
export function SessionStatsBlock({
  windowDays,
  showGrades,
  showBest,
  showDays,
}: SessionStatsConfig) {
  const runtime = useDrillRuntime();
  const pageId = runtime?.pageId ?? "";
  const { canPersist } = useAuthAccess();
  const localVersion = useLocalPracticeHistoryVersion();

  const remoteEvents = useQuery(
    api.tracking.listPracticeEventsByTool,
    canPersist ? { tool: "workshop" } : "skip"
  );

  const summary = useMemo(() => {
    if (pageId === "") return EMPTY_SESSION_SUMMARY;

    const events: PracticeSummaryEvent[] = canPersist
      ? (remoteEvents ?? [])
      : listLocalWorkshopEvents();

    return summarizePracticeEvents(events, { pageId, windowDays });
    // `localVersion` is the change signal for the Free-tier localStorage read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPersist, remoteEvents, pageId, windowDays, localVersion]);

  const loading = canPersist && remoteEvents === undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          This page
        </span>
        <span className="text-xs text-muted-foreground">
          last {windowDays} {windowDays === 1 ? "day" : "days"}
        </span>
      </div>

      {pageId === "" ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Stats appear once this block is on a saved practice page.
        </p>
      ) : (
        <>
          <div
            className={cn(
              "grid gap-2",
              showBest ? "grid-cols-3" : "grid-cols-2"
            )}
            data-testid="session-stats"
          >
            <Stat label="Reps" value={loading ? "…" : String(summary.reps)} />
            <Stat
              label="Average"
              value={loading ? "…" : formatMs(summary.averageMs)}
            />
            {showBest ? (
              <Stat
                label="Best"
                value={loading ? "…" : formatMs(summary.bestMs)}
              />
            ) : null}
          </div>

          {showGrades ? (
            <div className="flex flex-wrap items-center gap-3">
              {GRADE_LABELS.map((grade) => (
                <div key={grade} className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      GRADE_CLASSES[grade]
                    )}
                    aria-hidden
                  />
                  <span className="text-xs text-muted-foreground">
                    {grade} {summary.grades[grade]}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {showDays && summary.daysPracticed > 0 ? (
            <p className="text-xs text-muted-foreground" data-testid="days-practiced">
              Practiced on {summary.daysPracticed}{" "}
              {summary.daysPracticed === 1 ? "day" : "days"} in this window.
            </p>
          ) : null}

          {!loading && summary.reps === 0 ? (
            <p className="text-xs text-muted-foreground">
              No reps yet in this window — start the drill above.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
