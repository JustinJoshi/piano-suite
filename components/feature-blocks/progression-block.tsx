"use client";

import { useMemo } from "react";
import { useTargetSource } from "@/hooks/useTargetSource";
import { buildProgressionTargets } from "@/lib/drill-targets";
import { KEY_CYCLE_ORDER_LABELS } from "@/lib/key-cycles";
import { TargetBlockShell } from "@/components/feature-blocks/target-block-shell";
import {
  progressionText,
  type ProgressionBlockConfig,
} from "@/lib/feature-blocks/progression/config";

/**
 * A roman-numeral chord progression — ii–V–I, a 12-bar blues, a pop loop, or
 * anything the user types — optionally repeated through a key cycle.
 */
export function ProgressionBlock(config: ProgressionBlockConfig) {
  const { source, keyRoot, customText, cycleKeys, cycleOrder, keyCount } =
    config;

  const { targets, invalidTokens } = useMemo(
    () =>
      buildProgressionTargets({
        source,
        keyRoot,
        customText,
        cycleKeys,
        cycleOrder,
        keyCount,
      }),
    [source, keyRoot, customText, cycleKeys, cycleOrder, keyCount]
  );

  const state = useTargetSource("progression", targets);

  const subtitle = cycleKeys
    ? `${progressionText(config)} · ${KEY_CYCLE_ORDER_LABELS[cycleOrder]}`
    : `${progressionText(config)} · key of ${keyRoot}`;

  return (
    <TargetBlockShell
      label="Progression"
      subtitle={subtitle}
      state={state}
      emptyMessage="No chords — check the roman numerals in settings"
      footer={
        state.isActive && invalidTokens.length > 0 ? (
          <p className="text-xs text-destructive" role="status">
            Skipped {invalidTokens.length === 1 ? "token" : "tokens"}:{" "}
            {invalidTokens.join(", ")}
          </p>
        ) : null
      }
    />
  );
}
