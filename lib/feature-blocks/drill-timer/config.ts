import type { FieldDescriptor } from "../types";

export type DrillTimerConfig = {
  countdownSeconds: number;
  breakSeconds: number;
  multiRep: boolean;
  showLiveTimer: boolean;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

function toInt(n: unknown, fallback: number): number {
  const parsed = typeof n === "string" ? Number(n) : Number(n);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

function toBool(n: unknown, fallback: boolean): boolean {
  if (typeof n === "boolean") return n;
  if (n === "true" || n === 1 || n === "1") return true;
  if (n === "false" || n === 0 || n === "0") return false;
  return fallback;
}

export const drillTimerDefaultConfig: DrillTimerConfig = {
  countdownSeconds: 3,
  breakSeconds: 5,
  multiRep: false,
  showLiveTimer: true,
};

export function normalizeDrillTimerConfig(raw: unknown): DrillTimerConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;

  return {
    countdownSeconds: clamp(
      toInt(r.countdownSeconds, drillTimerDefaultConfig.countdownSeconds),
      0,
      30
    ),
    breakSeconds: clamp(
      toInt(r.breakSeconds, drillTimerDefaultConfig.breakSeconds),
      0,
      60
    ),
    multiRep: toBool(r.multiRep, drillTimerDefaultConfig.multiRep),
    showLiveTimer: toBool(r.showLiveTimer, drillTimerDefaultConfig.showLiveTimer),
  };
}

export const drillTimerFields: FieldDescriptor[] = [
  {
    kind: "range",
    key: "countdownSeconds",
    label: "Countdown",
    min: 0,
    max: 30,
    step: 1,
    helperText: "Seconds before the timer starts",
  },
  {
    kind: "range",
    key: "breakSeconds",
    label: "Break",
    min: 0,
    max: 60,
    step: 1,
    helperText: "Seconds of break between rounds",
  },
  {
    kind: "toggle",
    key: "multiRep",
    label: "Multi-rep mode",
    helperText: "Stay armed and repeat the drill until manually finished",
  },
  {
    kind: "toggle",
    key: "showLiveTimer",
    label: "Show live timer",
  },
];
