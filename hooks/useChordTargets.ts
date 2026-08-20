"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ROOTS,
  QUALITY_GROUPS,
  buildPitchClassSet,
  buildChord,
} from "@/lib/music-theory";
import type { ChordTarget } from "@/lib/drill-runtime";

export type ChordSetTargetConfig = {
  roots: string[];
  qualityGroups: string[];
  order: "sequential" | "random";
};

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function expandTargets(
  roots: string[],
  qualityGroups: string[]
): ChordTarget[] {
  const rootMap = new Map(ROOTS.map((r) => [r.name, r]));
  const qualityGroupMap = new Map(
    QUALITY_GROUPS.map((g) => [g.label, g.qualities])
  );

  const targets: ChordTarget[] = [];

  for (const rootName of roots) {
    const root = rootMap.get(rootName);
    if (!root) continue;

    for (const groupLabel of qualityGroups) {
      const qualities = qualityGroupMap.get(groupLabel);
      if (!qualities) continue;

      for (const quality of qualities) {
        const symbol = `${root.name}${quality.suffix}`;
        targets.push({
          id: symbol,
          symbol,
          notes: buildChord(root, quality.tones),
          pcs: buildPitchClassSet(root, quality.tones),
        });
      }
    }
  }

  return targets;
}

function targetsKey(targets: ChordTarget[], order: string): string {
  return `${order}:${targets.map((t) => t.id).join(",")}`;
}

export function useChordTargets(config: ChordSetTargetConfig) {
  const { roots, qualityGroups, order } = config;

  const targets = useMemo(() => {
    const expanded = expandTargets(roots, qualityGroups);
    return order === "random" ? shuffle(expanded) : expanded;
  }, [roots, qualityGroups, order]);

  const [index, setIndex] = useState(0);
  const previousKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = targetsKey(targets, config.order);
    if (previousKeyRef.current === null) {
      previousKeyRef.current = key;
      return;
    }
    if (previousKeyRef.current !== key) {
      previousKeyRef.current = key;
      setIndex(0);
    }
  }, [targets, config.order]);

  const current = targets[index] ?? null;

  const advance = useCallback(() => {
    setIndex((prev) => (prev + 1 < targets.length ? prev + 1 : prev));
  }, [targets.length]);

  const reset = useCallback(() => {
    setIndex(0);
  }, []);

  return {
    targets,
    current,
    index,
    total: targets.length,
    advance,
    reset,
  };
}
