"use client";

import { useTargetSource } from "@/hooks/useTargetSource";
import { useChordTargets } from "@/hooks/useChordTargets";
import { TargetBlockShell } from "@/components/feature-blocks/target-block-shell";
import type { ChordSetConfig } from "@/lib/feature-blocks/chord-set/config";

export function ChordSetBlock(config: ChordSetConfig) {
  const { targets } = useChordTargets({
    roots: config.roots,
    qualityGroups: config.qualityGroups,
    order: config.order,
  });

  const state = useTargetSource("chordSet", targets);

  return (
    <TargetBlockShell label="Chord target" state={state} />
  );
}
