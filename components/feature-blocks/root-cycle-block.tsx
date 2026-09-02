"use client";

import { useMemo } from "react";
import { useTargetSource } from "@/hooks/useTargetSource";
import { buildRootCycleTargets } from "@/lib/drill-targets";
import { KEY_CYCLE_ORDER_LABELS } from "@/lib/key-cycles";
import { TargetBlockShell } from "@/components/feature-blocks/target-block-shell";
import {
  cycleQualityById,
  type RootCycleConfig,
} from "@/lib/feature-blocks/root-cycle/config";

/**
 * One chord shape carried around the twelve keys — the "can I find this
 * anywhere" drill, as opposed to "do I know this shape in order".
 */
export function RootCycleBlock(config: RootCycleConfig) {
  const { qualityId, startRoot, order, keyCount } = config;

  const targets = useMemo(
    () => buildRootCycleTargets({ qualityId, startRoot, order, keyCount }),
    [qualityId, startRoot, order, keyCount]
  );

  const state = useTargetSource("rootCycle", targets);
  const quality = cycleQualityById(qualityId);

  return (
    <TargetBlockShell
      label="Key cycle"
      subtitle={`${quality.label} · ${KEY_CYCLE_ORDER_LABELS[order]}`}
      state={state}
      emptyMessage="No keys in this cycle"
    />
  );
}
