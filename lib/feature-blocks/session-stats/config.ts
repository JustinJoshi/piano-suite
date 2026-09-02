import { clamp, toBool, toInt } from "../coerce";
import type { FieldDescriptor } from "../types";

export type SessionStatsConfig = {
  /** How far back to look, in days. */
  windowDays: number;
  showGrades: boolean;
  showBest: boolean;
};

export const sessionStatsDefaultConfig: SessionStatsConfig = {
  windowDays: 7,
  showGrades: true,
  showBest: true,
};

export function normalizeSessionStatsConfig(raw: unknown): SessionStatsConfig {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  return {
    windowDays: clamp(toInt(r.windowDays, sessionStatsDefaultConfig.windowDays), 1, 365),
    showGrades: toBool(r.showGrades, sessionStatsDefaultConfig.showGrades),
    showBest: toBool(r.showBest, sessionStatsDefaultConfig.showBest),
  };
}

export const sessionStatsFields: FieldDescriptor[] = [
  {
    kind: "range",
    key: "windowDays",
    label: "Window",
    min: 1,
    max: 90,
    step: 1,
    helperText: "Days of history to summarise",
  },
  { kind: "toggle", key: "showGrades", label: "Show grade split" },
  { kind: "toggle", key: "showBest", label: "Show best time" },
];
