"use client";

import { useEffect } from "react";
import { useDrillRuntime, type ChordTarget } from "@/lib/drill-runtime";

export type TargetSourceState = {
  /** True once this block owns the runtime's target list. */
  isActive: boolean;
  /** True when a runtime exists but another target block already owns it. */
  isSuperseded: boolean;
  /** False outside a `DrillRuntimeProvider` (e.g. a static preview). */
  hasRuntime: boolean;
};

/**
 * Shared plumbing for every block that produces drill targets.
 *
 * A page has one runtime and one target list, so blocks register with the
 * runtime and only the first one still mounted writes to it. Blocks that lose
 * the race get `isSuperseded` and should render an explanation rather than
 * silently doing nothing.
 *
 * `targets` must be memoised by the caller — it is an effect dependency.
 */
export function useTargetSource(
  ownerKey: string,
  targets: ChordTarget[]
): TargetSourceState {
  const runtime = useDrillRuntime();
  const registerTargetSource = runtime?.registerTargetSource;
  const setTargets = runtime?.setTargets;
  const activeTargetSource = runtime?.activeTargetSource ?? null;

  useEffect(() => {
    if (!registerTargetSource) return;
    return registerTargetSource(ownerKey);
  }, [registerTargetSource, ownerKey]);

  const isActive = Boolean(runtime) && activeTargetSource === ownerKey;

  useEffect(() => {
    if (!setTargets || !isActive) return;
    setTargets(targets);
  }, [setTargets, isActive, targets]);

  return {
    isActive,
    isSuperseded:
      Boolean(runtime) && activeTargetSource !== null && !isActive,
    hasRuntime: Boolean(runtime),
  };
}
