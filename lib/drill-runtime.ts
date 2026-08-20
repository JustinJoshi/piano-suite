"use client";

import { createContext, useContext } from "react";

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
