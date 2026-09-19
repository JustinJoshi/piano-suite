import type { FieldDescriptor } from "../types";
import { toEnum } from "../coerce";

export type PieceLibraryConfig = {
  handFilter: "both" | "left" | "right";
  role: "graded" | "accompaniment";
  transpose: number;
};

export const pieceLibraryDefaultConfig: PieceLibraryConfig = {
  handFilter: "both",
  role: "graded",
  transpose: 0,
};

export function normalizePieceLibraryConfig(raw: unknown): PieceLibraryConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;
  const transpose =
    typeof r.transpose === "number" && Number.isFinite(r.transpose)
      ? Math.max(-12, Math.min(12, Math.round(r.transpose)))
      : pieceLibraryDefaultConfig.transpose;

  return {
    handFilter: toEnum(r.handFilter, ["both", "left", "right"] as const, pieceLibraryDefaultConfig.handFilter),
    role: toEnum(r.role, ["graded", "accompaniment"] as const, pieceLibraryDefaultConfig.role),
    transpose,
  };
}

export const pieceLibraryFields: FieldDescriptor[] = [
  {
    kind: "select",
    key: "handFilter",
    label: "Hands",
    options: [
      { label: "Both hands", value: "both" },
      { label: "Left hand only", value: "left" },
      { label: "Right hand only", value: "right" },
    ],
    helperText: "Practice one hand at a time",
  },
  {
    kind: "select",
    key: "role",
    label: "Role",
    options: [
      { label: "Practice part", value: "graded" },
      { label: "Backing track", value: "accompaniment" },
    ],
    helperText:
      "The practice part is what this page's displays show; the backing track is context. Neither is graded unless the page also has a target block.",
  },
  {
    kind: "range",
    key: "transpose",
    label: "Transpose",
    min: -12,
    max: 12,
    step: 1,
    helperText: "Semitones to shift the whole piece",
  },
];
