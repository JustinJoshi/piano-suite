import { BookOpen, Clock3, Music2, Timer, Wrench } from "lucide-react";
import { generateId } from "@/lib/custom-practice-storage";
import { normalizeStoredBlock, MAX_BLOCKS_PER_PAGE } from "@/lib/feature-blocks/schemas";
import type { FeatureBlock, PracticePage } from "@/lib/feature-blocks/types";
import type { LucideIcon } from "lucide-react";

export type StarterCategory = "getting-started" | "chords" | "rhythm" | "technique";

export type StarterTemplate = {
  id: string;
  title: string;
  description: string;
  category: StarterCategory;
  icon: LucideIcon;
  blocks: FeatureBlock[];
};

const block = (
  id: string,
  type: string,
  config: Record<string, unknown>
): FeatureBlock => ({ id, type, version: 1, config });

export const starterTemplates: StarterTemplate[] = [
  {
    id: "first-chords",
    title: "First chords",
    description: "Play 7th chords in C, F, and G with a gentle timer.",
    category: "getting-started",
    icon: BookOpen,
    blocks: [
      block("first-chords-notes", "textBlock", {
        text: "Play each chord slowly. Listen for clean, even notes before you speed up.",
      }),
      block("first-chords-set", "chordSet", {
        roots: ["C", "F", "G"],
        qualityGroups: ["7th"],
        order: "sequential",
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 2,
      }),
      block("first-chords-timer", "drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 5,
        multiRep: false,
        showLiveTimer: true,
      }),
      block("first-chords-midi", "midiConnectionBar", { compact: false }),
    ],
  },
  {
    id: "all-twelve-keys",
    title: "All twelve keys",
    description: "Run one chord idea through every root in the circle of fifths.",
    category: "chords",
    icon: Music2,
    blocks: [
      block("twelve-keys-set", "chordSet", {
        roots: ["C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F"],
        qualityGroups: ["7th"],
        order: "sequential",
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 2,
      }),
      block("twelve-keys-timer", "drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 3,
        multiRep: true,
        showLiveTimer: true,
      }),
      block("twelve-keys-midi", "midiConnectionBar", { compact: false }),
    ],
  },
  {
    id: "chord-qualities",
    title: "Chord qualities",
    description: "Hear and play four chord colors from one root.",
    category: "chords",
    icon: Music2,
    blocks: [
      block("qualities-notes", "textBlock", {
        text: "Play each quality and notice how its character changes. Stay relaxed and listen.",
      }),
      block("qualities-set", "chordSet", {
        roots: ["C"],
        qualityGroups: ["7th"],
        order: "random",
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 2,
      }),
      block("qualities-timer", "drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 5,
        multiRep: false,
        showLiveTimer: true,
      }),
    ],
  },
  {
    id: "ii-v-i-warmup",
    title: "ii-V-I warmup",
    description: "Cycle a familiar jazz progression as a focused warmup.",
    category: "chords",
    icon: Music2,
    blocks: [
      block("ii-v-i-notes", "textBlock", {
        text: "Keep the movement small and connected. Start at a tempo where every transition feels easy.",
      }),
      block("ii-v-i-set", "chordSet", {
        roots: ["C", "F", "G", "Bb"],
        qualityGroups: ["7th"],
        order: "sequential",
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 2,
      }),
      block("ii-v-i-timer", "drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 5,
        multiRep: true,
        showLiveTimer: true,
      }),
    ],
  },
  {
    id: "metronome-sprint",
    title: "Metronome sprint",
    description: "Spend five focused minutes building a steady time feel.",
    category: "rhythm",
    icon: Timer,
    blocks: [
      block("sprint-metronome", "metronome", {
        bpm: 80,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 220,
      }),
      block("sprint-timer", "drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 0,
        multiRep: true,
        showLiveTimer: true,
      }),
      block("sprint-notes", "textBlock", {
        text: "Choose one simple pattern. Keep going through small mistakes without stopping the beat.",
      }),
    ],
  },
  {
    id: "beginner-rhythm",
    title: "Beginner rhythm",
    description: "Find a comfortable pulse in 3/4 before adding complexity.",
    category: "rhythm",
    icon: Clock3,
    blocks: [
      block("rhythm-metronome", "metronome", {
        bpm: 60,
        beatsPerBar: 3,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 220,
      }),
      block("rhythm-notes", "textBlock", {
        text: "Count 1-2-3 out loud, then play a simple pattern while keeping the count steady.",
      }),
      block("rhythm-timer", "drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 5,
        multiRep: false,
        showLiveTimer: true,
      }),
    ],
  },
  {
    id: "daily-technique",
    title: "Daily technique",
    description: "A small, repeatable warmup for your daily practice habit.",
    category: "technique",
    icon: Wrench,
    blocks: [
      block("daily-notes", "textBlock", {
        text: "Warm up gently for a few minutes. Stop if anything hurts, and leave room for rest.",
      }),
      block("daily-metronome", "metronome", {
        bpm: 60,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 220,
      }),
      block("daily-timer", "drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 5,
        multiRep: true,
        showLiveTimer: true,
      }),
    ],
  },
  {
    id: "quick-notes",
    title: "Quick practice notes",
    description: "Start with a simple page for notes, ideas, and a connected keyboard.",
    category: "getting-started",
    icon: BookOpen,
    blocks: [
      block("quick-notes-text", "textBlock", {
        text: "Write down what you want to remember from today's practice.",
      }),
      block("quick-notes-midi", "midiConnectionBar", { compact: false }),
    ],
  },
];

export function normalizeStarterTemplate(raw: unknown): StarterTemplate | null {
  if (typeof raw !== "object" || raw === null) return null;
  const value = raw as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.description !== "string" ||
    !Array.isArray(value.blocks) ||
    !["getting-started", "chords", "rhythm", "technique"].includes(value.category as string)
  ) {
    return null;
  }

  const blocks = value.blocks
    .slice(0, MAX_BLOCKS_PER_PAGE)
    .map(normalizeStoredBlock)
    .filter((item): item is FeatureBlock => item !== null);
  if (blocks.length === 0) return null;

  const source = starterTemplates.find((template) => template.id === value.id);
  if (!source) return null;
  return { ...source, title: value.title, description: value.description, blocks };
}

export function buildTemplatePage(template: StarterTemplate): PracticePage {
  return {
    id: generateId(),
    title: template.title,
    blocks: template.blocks.map((item) => ({
      ...item,
      id: generateId(),
      config: { ...item.config },
    })),
    updatedAt: Date.now(),
  };
}
