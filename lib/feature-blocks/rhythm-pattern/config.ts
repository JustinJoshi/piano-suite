import type { FieldDescriptor } from "../types";

export type RhythmPatternConfig = {
  leftPattern: string;
  rightPattern: string;
  barsPerCycle: number;
  durationRatio: number;
};

function toInt(n: unknown, fallback: number): number {
  const parsed = typeof n === "string" ? Number(n) : Number(n);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

function toString(n: unknown, fallback: string): string {
  if (typeof n === "string") return n;
  return fallback;
}

function toNumber(n: unknown, fallback: number): number {
  const parsed = typeof n === "string" ? Number(n) : Number(n);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export const rhythmPatternDefaultConfig: RhythmPatternConfig = {
  // Alternating quarter notes between the hands: the natural starting drill.
  leftPattern: "1000",
  rightPattern: "0100",
  barsPerCycle: 1,
  durationRatio: 1.0,
};

export function normalizeRhythmPatternConfig(raw: unknown): RhythmPatternConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;

  return {
    leftPattern: toString(r.leftPattern, rhythmPatternDefaultConfig.leftPattern),
    rightPattern: toString(r.rightPattern, rhythmPatternDefaultConfig.rightPattern),
    barsPerCycle: clamp(
      toInt(r.barsPerCycle, rhythmPatternDefaultConfig.barsPerCycle),
      1,
      16
    ),
    durationRatio: clamp(
      toNumber(r.durationRatio, rhythmPatternDefaultConfig.durationRatio),
      0.1,
      1.0
    ),
  };
}

export const rhythmPatternFields: FieldDescriptor[] = [
  {
    kind: "text",
    key: "leftPattern",
    label: "Left hand pattern",
    placeholder: "16th-note grid: 1000 = quarters, 10 = eighths",
  },
  {
    kind: "text",
    key: "rightPattern",
    label: "Right hand pattern",
    placeholder: "16th-note grid: 1000 = quarters, 10 = eighths",
  },
  {
    kind: "range",
    key: "barsPerCycle",
    label: "Bars per cycle",
    min: 1,
    max: 16,
    step: 1,
    helperText: "Pattern repeats every N bars",
  },
  {
    kind: "range",
    key: "durationRatio",
    label: "Duration ratio",
    min: 0.1,
    max: 1.0,
    step: 0.1,
    helperText: "How long each note plays (0.1 = staccato, 1.0 = legato)",
  },
];
