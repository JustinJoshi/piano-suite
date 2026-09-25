/**
 * The landing page's ledger: runs of its four-chord drill, kept in this
 * browser's localStorage under their own key. Deliberately separate from
 * practice history (`lib/local-practice-history.ts`) — a try-it on the
 * landing page is not a practice session and must not show up in Tracking.
 */

import type { RollDrillResult } from "./roll-drill";

export const ROLL_LEDGER_KEY = "piano-suite:roll-ledger-v1";
export const ROLL_LEDGER_EVENT = "piano-suite:roll-ledger";
const MAX_RUNS = 60;

export type RollRun = { at: number; results: RollDrillResult[] };

function isRun(value: unknown): value is RollRun {
  if (!value || typeof value !== "object") return false;
  const run = value as Record<string, unknown>;
  return (
    typeof run.at === "number" &&
    Array.isArray(run.results) &&
    run.results.every(
      (r) =>
        r &&
        typeof r === "object" &&
        typeof (r as RollDrillResult).name === "string" &&
        typeof (r as RollDrillResult).ms === "number" &&
        typeof (r as RollDrillResult).misses === "number"
    )
  );
}

/** Parse stored runs; drops anything malformed. */
export function parseRuns(raw: string | null): RollRun[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.filter(isRun) : [];
  } catch {
    return [];
  }
}

/** Runs from storage, or null when the browser refuses storage entirely. */
export function loadRuns(storage: Storage | null = safeStorage()): RollRun[] | null {
  if (!storage) return null;
  try {
    return parseRuns(storage.getItem(ROLL_LEDGER_KEY));
  } catch {
    return null;
  }
}

export function saveRun(run: RollRun, storage: Storage | null = safeStorage()): boolean {
  const runs = loadRuns(storage);
  if (!storage || !runs) return false;
  try {
    storage.setItem(ROLL_LEDGER_KEY, JSON.stringify([...runs, run].slice(-MAX_RUNS)));
    return true;
  } catch {
    return false;
  }
}

export function clearRuns(storage: Storage | null = safeStorage()): void {
  try {
    storage?.removeItem(ROLL_LEDGER_KEY);
  } catch {
    /* storage blocked */
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/**
 * Consecutive days with at least one run, ending today — or yesterday, so a
 * streak isn't broken until a whole day has been missed.
 */
export function streakDays(runs: RollRun[], now = new Date()): number {
  const days = new Set(runs.map((r) => dayKey(new Date(r.at))));
  const cursor = new Date(now);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

export function runTotal(run: RollRun): number {
  return run.results.reduce((sum, r) => sum + r.ms, 0);
}

/** "Today, 9:24 PM", "Yesterday, 8:02 AM", or "Sep 3". */
export function describeWhen(at: number, now = new Date()): string {
  const d = new Date(at);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (dayKey(d) === dayKey(now)) return `Today, ${time}`;
  if (dayKey(d) === dayKey(yesterday)) return `Yesterday, ${time}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
