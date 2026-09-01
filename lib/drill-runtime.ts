"use client";

import { createContext, useContext } from "react";
import { normalizeDrillTimerConfig } from "@/lib/feature-blocks/drill-timer/config";
import { normalizeChordSetConfig } from "@/lib/feature-blocks/chord-set/config";

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
};

const DrillRuntimeContext = createContext<DrillRuntime | null>(null);

export const DrillRuntimeProvider = DrillRuntimeContext.Provider;

export function useDrillRuntime(): DrillRuntime | null {
  return useContext(DrillRuntimeContext);
}

/**
 * Page-level drill configuration resolved from feature blocks.
 *
 * `goodThreshold` / `hardThreshold` are miss-count thresholds (the chord-set
 * settings editor labels them "max misses for a Good/Hard grade"), matching
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
 * the first `chordSet` block owns scoring (require-exact, grade thresholds).
 *
 * Without a `drillTimer` block, `multiRep` stays true so multi-target chord
 * sets keep their legacy behavior of running every target in one round.
 */
export function runtimeOptionsFromBlocks(
  blocks: Array<{ type: string; config: unknown }>
): DrillRuntimeConfig {
  const timerBlock = blocks.find((b) => b.type === "drillTimer");
  const chordBlock = blocks.find((b) => b.type === "chordSet");

  const timer = timerBlock
    ? normalizeDrillTimerConfig(timerBlock.config)
    : null;
  const chords = chordBlock
    ? normalizeChordSetConfig(chordBlock.config)
    : null;

  return {
    countdownSeconds: timer?.countdownSeconds ?? 3,
    breakSeconds: timer?.breakSeconds ?? 5,
    multiRep: timer ? timer.multiRep : NO_TIMER_BLOCK_DEFAULTS.multiRep,
    requireExact: chords?.requireExact ?? false,
    goodThreshold: chords?.goodThreshold ?? 0,
    hardThreshold: chords?.hardThreshold ?? 2,
  };
}
