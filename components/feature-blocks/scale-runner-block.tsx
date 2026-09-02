"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useDrillRuntime } from "@/lib/drill-runtime";
import { useTargetSource } from "@/hooks/useTargetSource";
import { buildScaleTargets } from "@/lib/drill-targets";
import { scaleRunLabel } from "@/lib/scales";
import { TargetBlockShell } from "@/components/feature-blocks/target-block-shell";
import type { ScaleRunnerConfig } from "@/lib/feature-blocks/scale-runner/config";

/**
 * A scale, mode, or five-finger pattern as an ordered run of single notes —
 * the warm-up every practice routine opens with.
 */
export function ScaleRunnerBlock(config: ScaleRunnerConfig) {
  const targets = useMemo(() => buildScaleTargets(config), [config]);
  const state = useTargetSource("scaleRunner", targets);
  const runtime = useDrillRuntime();

  const subtitle = scaleRunLabel(config.root, config.scaleId, config.span);
  const currentIndex = runtime?.targetIndex ?? 0;

  return (
    <TargetBlockShell
      label="Scale run"
      subtitle={subtitle}
      state={state}
      emptyMessage="This scale has no notes to run"
      footer={
        state.isActive && targets.length > 0 ? (
          <div
            className="flex flex-wrap gap-1"
            aria-label="Notes in this run"
            data-testid="scale-run-notes"
          >
            {targets.map((target, index) => (
              <span
                key={target.id}
                className={cn(
                  "rounded px-1.5 py-0.5 text-xs tabular-nums",
                  index === currentIndex
                    ? "bg-primary text-primary-foreground"
                    : index < currentIndex
                      ? "text-muted-foreground line-through"
                      : "text-muted-foreground"
                )}
              >
                {target.symbol}
              </span>
            ))}
          </div>
        ) : null
      }
    />
  );
}
