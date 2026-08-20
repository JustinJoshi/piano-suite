import { Timer, Hourglass, Music } from "lucide-react";
import { MetronomeBlock } from "@/components/feature-blocks/metronome-block";
import { DrillTimerBlock } from "@/components/feature-blocks/drill-timer-block";
import { ChordSetBlock } from "@/components/feature-blocks/chord-set-block";
import {
  metronomeDefaultConfig,
  normalizeMetronomeConfig,
  metronomeFields,
} from "@/lib/feature-blocks/metronome/config";
import {
  drillTimerDefaultConfig,
  normalizeDrillTimerConfig,
  drillTimerFields,
} from "@/lib/feature-blocks/drill-timer/config";
import {
  chordSetDefaultConfig,
  normalizeChordSetConfig,
  chordSetFields,
} from "@/lib/feature-blocks/chord-set/config";
import type { ComponentType } from "react";
import type { FeatureDefinition } from "@/lib/feature-blocks/types";

export const featureRegistry = {
  metronome: {
    type: "metronome",
    category: "rhythm",
    label: "Metronome",
    description: "Keep a steady beat while you practice.",
    icon: Timer,
    fields: metronomeFields,
    defaultConfig: metronomeDefaultConfig,
    normalizeConfig: normalizeMetronomeConfig,
    component: MetronomeBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  drillTimer: {
    type: "drillTimer",
    category: "technique",
    label: "Drill timer",
    description: "Countdown, live timing, and break between rounds.",
    icon: Hourglass,
    fields: drillTimerFields,
    defaultConfig: drillTimerDefaultConfig,
    normalizeConfig: normalizeDrillTimerConfig,
    component: DrillTimerBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  chordSet: {
    type: "chordSet",
    category: "theory",
    label: "Chord set",
    description: "Practice a set of chords in order or at random.",
    icon: Music,
    fields: chordSetFields,
    defaultConfig: chordSetDefaultConfig,
    normalizeConfig: normalizeChordSetConfig,
    component: ChordSetBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
};

export type FeatureType = keyof typeof featureRegistry;

export function getFeatureDefinition(type: string) {
  return featureRegistry[type as FeatureType] ?? null;
}

export function isFeatureType(type: string): type is FeatureType {
  return type in featureRegistry;
}

export const featureCategories = [
  { id: "rhythm", label: "Rhythm" },
  { id: "technique", label: "Technique" },
  { id: "theory", label: "Theory" },
  { id: "visualization", label: "Visualization" },
] as const;
