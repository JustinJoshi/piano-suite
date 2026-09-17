// Relative imports only — this module is written to be safe for a future
// Next.js route handler and a future Convex-adjacent caller alike, matching
// the discipline in `target-blocks.ts`. No React, no DOM, no fetch.
import { validatePageWiring } from "./manifest";
import type { FeatureBlock } from "./types";
import type { WiringIssue } from "./manifest-types";

export type ArrangementResult =
  | { status: "valid" }
  | { status: "invalid"; issues: WiringIssue[] };

/**
 * Pure pass/fail wrapper around `validatePageWiring`. The two later phases
 * that call this (an API route, an editor notice) each want a typed result
 * they can branch on, rather than checking whether an array is empty.
 */
export function validateArrangement(blocks: FeatureBlock[]): ArrangementResult {
  const issues = validatePageWiring(blocks);
  if (issues.length === 0) {
    return { status: "valid" };
  }
  return { status: "invalid", issues };
}
