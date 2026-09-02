/**
 * Shared coercion helpers for block config normalizers.
 *
 * Stored block config is untrusted (localStorage, a shared page, a Convex
 * row written by an older client), so every normalizer has to defend the same
 * few shapes. Kept relative-import-only so the Convex bundler can pull it in
 * via `schemas.ts`.
 */

import type { FieldDescriptor } from "./types";

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function toInt(raw: unknown, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

export function toBool(raw: unknown, fallback: boolean): boolean {
  if (typeof raw === "boolean") return raw;
  if (raw === "true" || raw === 1 || raw === "1") return true;
  if (raw === "false" || raw === 0 || raw === "0") return false;
  return fallback;
}

/** Returns `raw` when it is one of `allowed`, else `fallback`. */
export function toEnum<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return typeof raw === "string" && (allowed as readonly string[]).includes(raw)
    ? (raw as T)
    : fallback;
}

export function toText(raw: unknown, fallback: string, maxLength = 200): string {
  if (typeof raw !== "string") return fallback;
  return raw.slice(0, maxLength);
}

/**
 * Miss-count grade thresholds, shared by every block that provides drill
 * targets. `goodThreshold` / `hardThreshold` feed `gradeForMisses`.
 */
export type ScoringConfig = {
  requireExact: boolean;
  goodThreshold: number;
  hardThreshold: number;
};

export function normalizeScoring(
  raw: Record<string, unknown>,
  defaults: ScoringConfig
): ScoringConfig {
  return {
    requireExact: toBool(raw.requireExact, defaults.requireExact),
    goodThreshold: clamp(toInt(raw.goodThreshold, defaults.goodThreshold), 0, 99),
    hardThreshold: clamp(toInt(raw.hardThreshold, defaults.hardThreshold), 0, 99),
  };
}

/**
 * The settings rows every target-providing block shares, so scoring reads the
 * same way in the scale runner as it does in the chord set.
 */
export const scoringFields: FieldDescriptor[] = [
  {
    kind: "toggle",
    key: "requireExact",
    label: "Require exact notes",
    helperText: "Extra notes count as wrong",
  },
  {
    kind: "range",
    key: "goodThreshold",
    label: "Good threshold",
    min: 0,
    max: 20,
    step: 1,
    helperText: "Max misses for a Good grade",
  },
  {
    kind: "range",
    key: "hardThreshold",
    label: "Hard threshold",
    min: 0,
    max: 20,
    step: 1,
    helperText: "Max misses for a Hard grade",
  },
];
