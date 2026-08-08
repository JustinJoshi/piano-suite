"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BUILT_IN_PRESETS,
  PRESET_CATEGORIES,
  getPresetLabel,
  type AudioPreset,
} from "@/lib/audio-presets";

type PresetPickerProps = {
  activePreset: AudioPreset;
  onSelect: (preset: AudioPreset) => void;
};

const CATEGORY_ORDER = [
  "Acoustic Pianos",
  "Electric Pianos",
  "Organs & Vintage Keys",
  "Synths",
  "Mallets & Bells",
];

const presetsByCategory = CATEGORY_ORDER.map((category) => ({
  category,
  presets: BUILT_IN_PRESETS.filter(
    (preset) => PRESET_CATEGORIES[preset] === category
  ),
}));

export function PresetPicker({ activePreset, onSelect }: PresetPickerProps) {
  return (
    <div className="space-y-6">
      {presetsByCategory.map(({ category, presets }) => (
        <div key={category}>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {category}
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {presets.map((preset) => {
              const isActive = activePreset === preset;
              return (
                <button
                  key={preset}
                  onClick={() => onSelect(preset)}
                  className={cn(
                    "relative flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    "hover:border-primary/50 hover:bg-card/80",
                    isActive && "border-primary/50 bg-primary/5 ring-1 ring-primary"
                  )}
                  aria-pressed={isActive}
                  data-testid={`audio-preset-${preset}`}
                >
                  <span className="text-foreground">
                    {getPresetLabel(preset)}
                  </span>
                  {isActive && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
