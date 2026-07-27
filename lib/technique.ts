/**
 * Pure helpers for the Technique Habit Tracker.
 *
 * Date handling uses UTC YYYY-MM-DD strings so the same date is reported
 * regardless of the user's local timezone offset. This matches the original
 * Reflex Drill EXT technique tracker.
 */

export type TechniqueSession = {
  bpm: number;
  notes?: string;
  exercise?: string;
};

export type TechniqueLog = Record<string, TechniqueSession>;

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoStr(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function computeStreak(log: TechniqueLog): number {
  let streak = 0;
  for (let i = 0; ; i++) {
    const d = daysAgoStr(i);
    if (log[d]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export type GridDay = {
  date: string;
  done: boolean;
  isToday: boolean;
  bpm?: number;
};

export function buildGrid(log: TechniqueLog, windowDays = 28): GridDay[] {
  const today = todayStr();
  return Array.from({ length: windowDays }, (_, i) => {
    const date = daysAgoStr(windowDays - 1 - i);
    const entry = log[date];
    return {
      date,
      done: !!entry,
      isToday: date === today,
      bpm: entry?.bpm,
    };
  });
}
