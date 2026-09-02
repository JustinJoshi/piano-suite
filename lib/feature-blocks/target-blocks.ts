import { normalizeChordSetConfig } from "./chord-set/config";
import { normalizeScaleRunnerConfig } from "./scale-runner/config";
import { normalizeRootCycleConfig } from "./root-cycle/config";
import { normalizeProgressionBlockConfig } from "./progression/config";
import type { ScoringConfig } from "./coerce";

/**
 * Target-block arbitration.
 *
 * A practice page has exactly one drill runtime, and the runtime holds one
 * ordered list of targets. Several blocks can *produce* targets (a chord set,
 * a scale run, a key cycle, a progression), so the page needs a rule for who
 * wins: **the first target block in page order owns the runtime**, and the
 * others render an inert notice instead of fighting over `setTargets`.
 *
 * The same block also owns scoring, because `requireExact` means something
 * different for a single scale note than for a five-note chord.
 *
 * Relative imports only — `lib/drill-runtime.ts` and the Convex-bundled
 * `schemas.ts` both reach this module.
 */

export const TARGET_BLOCK_TYPES = [
  "chordSet",
  "scaleRunner",
  "rootCycle",
  "progression",
] as const;

export type TargetBlockType = (typeof TARGET_BLOCK_TYPES)[number];

export function isTargetBlockType(type: string): type is TargetBlockType {
  return (TARGET_BLOCK_TYPES as readonly string[]).includes(type);
}

/** Used when a page carries no target block at all. */
export const DEFAULT_TARGET_SCORING: ScoringConfig = {
  requireExact: false,
  goodThreshold: 0,
  hardThreshold: 2,
};

const scoringResolvers: Record<TargetBlockType, (raw: unknown) => ScoringConfig> = {
  chordSet: normalizeChordSetConfig,
  scaleRunner: normalizeScaleRunnerConfig,
  rootCycle: normalizeRootCycleConfig,
  progression: normalizeProgressionBlockConfig,
};

export function resolveTargetScoring(
  type: string,
  config: unknown
): ScoringConfig | null {
  if (!isTargetBlockType(type)) return null;
  const { requireExact, goodThreshold, hardThreshold } =
    scoringResolvers[type](config);
  return { requireExact, goodThreshold, hardThreshold };
}

/**
 * The block that owns the runtime's targets: the first one in page order.
 */
export function activeTargetBlock<T extends { type: string }>(
  blocks: readonly T[]
): T | null {
  return blocks.find((block) => isTargetBlockType(block.type)) ?? null;
}

/**
 * True when `block` is present but *not* the owner, i.e. the editor should
 * tell the user this tile is inert on this page.
 */
export function isSupersededTargetBlock<T extends { type: string }>(
  blocks: readonly T[],
  block: T
): boolean {
  if (!isTargetBlockType(block.type)) return false;
  const owner = activeTargetBlock(blocks);
  return owner !== null && owner !== block;
}
