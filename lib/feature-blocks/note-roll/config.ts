import type { FieldDescriptor } from "../types";

export type NoteRollConfig = {
  /** Time in milliseconds to show notes before they reach the hit line. */
  lookaheadMs: number;
  /** Pixels per second for falling notes. */
  scrollSpeed: number;
  /** Filter notes: both hands, left hand only, or right hand only. */
  handFilter: "both" | "left" | "right";
  /** Show note names (C, D, E, etc.) on the notes. */
  showNoteNames: boolean;
  /** Wait mode: if true, scroll only starts when the first note arrives. */
  waitMode: boolean;
};

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

function toEnum<T>(n: unknown, fallback: T, valid: readonly T[]): T {
  return valid.includes(n as T) ? (n as T) : fallback;
}

export const noteRollDefaultConfig: NoteRollConfig = {
  lookaheadMs: 2000,
  scrollSpeed: 300,
  handFilter: "both",
  showNoteNames: true,
  waitMode: false,
};

export function normalizeNoteRollConfig(raw: unknown): NoteRollConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;

  return {
    lookaheadMs: Math.max(
      500,
      Math.min(5000, toInt(r.lookaheadMs, noteRollDefaultConfig.lookaheadMs))
    ),
    scrollSpeed: Math.max(
      100,
      Math.min(600, toInt(r.scrollSpeed, noteRollDefaultConfig.scrollSpeed))
    ),
    handFilter: toEnum(r.handFilter, noteRollDefaultConfig.handFilter, [
      "both",
      "left",
      "right",
    ] as const),
    showNoteNames: toBool(
      r.showNoteNames,
      noteRollDefaultConfig.showNoteNames
    ),
    waitMode: toBool(r.waitMode, noteRollDefaultConfig.waitMode),
  };
}

export const noteRollFields: FieldDescriptor[] = [
  {
    kind: "range",
    key: "lookaheadMs",
    label: "Lookahead time",
    min: 500,
    max: 5000,
    step: 100,
    helperText: "Milliseconds to show notes before they reach the hit line",
  },
  {
    kind: "range",
    key: "scrollSpeed",
    label: "Scroll speed",
    min: 100,
    max: 600,
    step: 50,
    helperText: "Pixels per second for falling notes",
  },
  {
    kind: "select",
    key: "handFilter",
    label: "Hand filter",
    options: [
      { label: "Both hands", value: "both" },
      { label: "Left hand only", value: "left" },
      { label: "Right hand only", value: "right" },
    ],
    helperText: "Show notes from one hand or both",
  },
  {
    kind: "toggle",
    key: "showNoteNames",
    label: "Show note names",
    helperText: "Display note labels (C, D, E, etc.)",
  },
  {
    kind: "toggle",
    key: "waitMode",
    label: "Wait for first note",
    helperText: "Scroll starts when the first note arrives, not immediately",
  },
];
