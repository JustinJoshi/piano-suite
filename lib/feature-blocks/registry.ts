import { Timer } from "lucide-react";
import { MetronomeBlock } from "@/components/feature-blocks/metronome-block";
import {
  metronomeDefaultConfig,
  normalizeMetronomeConfig,
  metronomeFields,
} from "@/lib/feature-blocks/metronome/config";
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
