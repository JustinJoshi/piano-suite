/**
 * Pure scale-library generation. Built-in patterns reuse `lib/scales.ts`;
 * the custom cell adds the Hanon-style degree patterns that motivated this
 * source: Hanon No. 10 is one cell plus a transposition rule, not a page
 * of hand-authored notes.
 */

import {
  scaleDefinition,
  ascendingOffsets,
  applyPattern,
  applyDirection,
} from "../../scales";
import { parseRoot, noteName } from "../../music-theory";
import type { PracticeNote } from "../../practice-note";
import type { ScaleLibraryConfig } from "./config";

/**
 * Expand a degree cell over an ascending run. `cell` holds 1-based degrees
 * relative to the current starting step: "1235" from step 0 plays degrees
 * 1, 2, 3, 5 — from step 1 it plays 2, 3, 4, 6, and so on. Degrees past the
 * end of the run are dropped.
 */
export function expandCell(ascending: number[], cell: number[]): number[] {
  if (cell.length === 0 || ascending.length === 0) return ascending;

  const out: number[] = [];
  for (let start = 0; start < ascending.length; start++) {
    for (const degree of cell) {
      const idx = start + degree - 1;
      if (idx >= 0 && idx < ascending.length) {
        out.push(ascending[idx]);
      }
    }
  }
  return out;
}

/** Parse "1235" into [1, 2, 3, 5]. Non-digits are ignored. */
export function parseCell(text: string): number[] {
  return [...text]
    .map((ch) => Number(ch))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 9);
}

/**
 * Generate the configured scale run as one PracticeNote per step.
 * Returns an empty array for an unknown scale so the block can render an
 * empty state instead of throwing.
 */
export function generateScale(config: ScaleLibraryConfig): PracticeNote[] {
  const def = scaleDefinition(config.scale);
  const root = parseRoot(config.root);
  if (!def || !root) return [];

  const useFlats = root.flat;
  const baseMidi = 60 + root.pc; // Start every run around middle C.
  let offsets: number[];

  if (config.pattern === "custom") {
    const ascending = ascendingOffsets(def.intervals, config.span);
    offsets = applyDirection(expandCell(ascending, parseCell(config.customCell)), config.direction);
  } else {
    offsets = applyDirection(
      applyPattern(ascendingOffsets(def.intervals, config.span), config.pattern),
      config.direction
    );
  }

  const hand = config.hands === "both" ? undefined : config.hands;
  const once: PracticeNote[] = offsets.map((offset) => ({
    midi: [baseMidi + offset],
    pcs: new Set([(root.pc + offset) % 12]),
    symbol: noteName(root.pc + offset, useFlats),
    hand,
  }));

  const out: PracticeNote[] = [];
  for (let i = 0; i < Math.max(1, config.loopCount); i++) {
    out.push(...once);
  }
  return out;
}
