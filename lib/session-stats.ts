/**
 * Summary math for the session-stats block.
 *
 * Both tiers feed the same shape: Convex `practiceEvents` rows (Pro) and
 * `listLocalWorkshopEvents()` rows (Free) already agree on
 * `reactionTimeMs` / `grade` / `timestamp` / `pageId`.
 *
 * Free of React, DOM, MIDI, and Convex dependencies.
 */

export type PracticeSummaryEvent = {
  reactionTimeMs: number;
  grade?: string;
  timestamp: number;
  pageId?: string;
};

/** Anki-style grade labels, in the order the UI shows them. */
export const GRADE_LABELS = ["Again", "Hard", "Good", "Easy"] as const;
export type GradeLabel = (typeof GRADE_LABELS)[number];

export type SessionSummary = {
  reps: number;
  /** Fastest successful rep in the window, or null when there are none. */
  bestMs: number | null;
  averageMs: number | null;
  grades: Record<GradeLabel, number>;
  /** Timestamp of the most recent rep, or null. */
  lastPracticedAt: number | null;
  /** Distinct calendar days practiced in the window (local time). */
  daysPracticed: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function emptyGrades(): Record<GradeLabel, number> {
  return { Again: 0, Hard: 0, Good: 0, Easy: 0 };
}

export const EMPTY_SESSION_SUMMARY: SessionSummary = {
  reps: 0,
  bestMs: null,
  averageMs: null,
  grades: emptyGrades(),
  lastPracticedAt: null,
  daysPracticed: 0,
};

function isGradeLabel(value: unknown): value is GradeLabel {
  return (
    typeof value === "string" && (GRADE_LABELS as readonly string[]).includes(value)
  );
}

export type SummarizeOptions = {
  /** Only count events from this practice page. */
  pageId: string;
  windowDays: number;
  /** Injectable for tests. */
  now?: number;
};

/**
 * Roll a list of practice events into the numbers a practice page wants to
 * show: how much work, how fast, and how it graded.
 */
export function summarizePracticeEvents(
  events: readonly PracticeSummaryEvent[],
  { pageId, windowDays, now = Date.now() }: SummarizeOptions
): SessionSummary {
  const cutoff = now - windowDays * MS_PER_DAY;

  const relevant = events.filter(
    (event) =>
      event.pageId === pageId &&
      Number.isFinite(event.timestamp) &&
      event.timestamp >= cutoff
  );

  if (relevant.length === 0) return { ...EMPTY_SESSION_SUMMARY, grades: emptyGrades() };

  const grades = emptyGrades();
  const days = new Set<string>();
  let total = 0;
  let best = Number.POSITIVE_INFINITY;
  let last = 0;

  for (const event of relevant) {
    total += event.reactionTimeMs;
    if (event.reactionTimeMs < best) best = event.reactionTimeMs;
    if (event.timestamp > last) last = event.timestamp;
    if (isGradeLabel(event.grade)) grades[event.grade] += 1;
    days.add(new Date(event.timestamp).toDateString());
  }

  return {
    reps: relevant.length,
    bestMs: Number.isFinite(best) ? Math.round(best) : null,
    averageMs: Math.round(total / relevant.length),
    grades,
    lastPracticedAt: last,
    daysPracticed: days.size,
  };
}

/** "1.24s" / "840ms" — short enough to sit in a stat tile. */
export function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
