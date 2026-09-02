"use client";

import { createContext, useContext } from "react";
import { normalizeDrillTimerConfig } from "@/lib/feature-blocks/drill-timer/config";
import {
  activeTargetBlock,
  resolveTargetScoring,
  DEFAULT_TARGET_SCORING,
} from "@/lib/feature-blocks/target-blocks";

export type DrillPhase =
  | "idle"
  | "countdown"
  | "armed"
  | "timing"
  | "success"
  | "break-before-grade"
  | "finished";

export type ChordTarget = {
  id: string;
  symbol: string;
  notes: string[];
  pcs: Set<number>;
};

export type DrillRuntime = {
  /** Practice page this runtime belongs to; "" in preview contexts. */
  pageId: string;

  phase: DrillPhase;
  liveMs: number;
  countdownValue: number;
  breakRemaining: number;

  currentTarget: ChordTarget | null;
  targetIndex: number;
  totalTargets: number;
  misses: number;

  start: () => void;
  reset: () => void;
  setTargets: (targets: ChordTarget[]) => void;
  skipTarget: () => void;

  /**
   * Claim the runtime's target list for a block type. Returns an unregister
   * function. The first claimant still mounted owns the targets; every target
   * block goes through `hooks/useTargetSource.ts` rather than calling this.
   */
  registerTargetSource: (ownerKey: string) => () => void;
  /** Owner key currently allowed to call `setTargets`, or null. */
  activeTargetSource: string | null;
};

const DrillRuntimeContext = createContext<DrillRuntime | null>(null);

export const DrillRuntimeProvider = DrillRuntimeContext.Provider;

export function useDrillRuntime(): DrillRuntime | null {
  return useContext(DrillRuntimeContext);
}

/**
 * Page-level drill configuration resolved from feature blocks.
 *
 * `goodThreshold` / `hardThreshold` are miss-count thresholds (target-block
 * settings editors label them "max misses for a Good/Hard grade"), matching
 * `gradeForMisses` in `lib/sequence-drill.ts`.
 */
export type DrillRuntimeConfig = {
  countdownSeconds: number;
  breakSeconds: number;
  multiRep: boolean;
  requireExact: boolean;
  goodThreshold: number;
  hardThreshold: number;
};

/** Used when a page carries no drill-timer block at all. */
const NO_TIMER_BLOCK_DEFAULTS = {
  multiRep: true,
} as const;

/**
 * Derive the drill runtime config from a page's blocks: the first
 * `drillTimer` block owns the round shape (countdown / break / multi-rep),
 * and the first *target* block owns scoring (require-exact, grade
 * thresholds) — a chord set, scale run, key cycle, or progression.
 *
 * Without a `drillTimer` block, `multiRep` stays true so multi-target pages
 * keep their legacy behavior of running every target in one round.
 */
export function runtimeOptionsFromBlocks(
  blocks: Array<{ type: string; config: unknown }>
): DrillRuntimeConfig {
  const timerBlock = blocks.find((b) => b.type === "drillTimer");
  const targetBlock = activeTargetBlock(blocks);

  const timer = timerBlock
    ? normalizeDrillTimerConfig(timerBlock.config)
    : null;
  const scoring =
    (targetBlock
      ? resolveTargetScoring(targetBlock.type, targetBlock.config)
      : null) ?? DEFAULT_TARGET_SCORING;

  return {
    countdownSeconds: timer?.countdownSeconds ?? 3,
    breakSeconds: timer?.breakSeconds ?? 5,
    multiRep: timer ? timer.multiRep : NO_TIMER_BLOCK_DEFAULTS.multiRep,
    requireExact: scoring.requireExact,
    goodThreshold: scoring.goodThreshold,
    hardThreshold: scoring.hardThreshold,
  };
}
