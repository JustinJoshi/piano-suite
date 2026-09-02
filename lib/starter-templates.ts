import {
  AudioWaveform,
  BookOpen,
  Clock3,
  ListMusic,
  Music2,
  RefreshCw,
  Timer,
  Wrench,
} from "lucide-react";
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
      block("first-chords-drills", "drillShortcuts", {}),
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
      block("quick-notes-drills", "drillShortcuts", {}),
    ],
  },
  {
    id: "music-theory-starter",
    title: "Music theory starter",
    description: "Chord practice, a timer, and your MIDI status — the theory route's page.",
    category: "getting-started",
    icon: BookOpen,
    blocks: [
      block("theory-starter-notes", "textBlock", {
        text: "Keep Anki open beside the Chord Drill. Look up new chords on piano-chords.org, then drill until recall is instant.",
      }),
      block("theory-starter-set", "chordSet", {
        roots: ["C", "F", "G", "D", "A", "E"],
        qualityGroups: ["7th"],
        order: "random",
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 2,
      }),
      block("theory-starter-timer", "drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 5,
        multiRep: false,
        showLiveTimer: true,
      }),
      block("theory-starter-midi", "midiConnectionBar", { compact: false }),
      block("theory-starter-drills", "drillShortcuts", {}),
    ],
  },
  {
    id: "finger-flexibility-starter",
    title: "Finger flexibility starter",
    description: "Metronome, timer, and shortcuts — the finger flexibility route's page.",
    category: "technique",
    icon: Wrench,
    blocks: [
      block("flexibility-starter-notes", "textBlock", {
        text: "Warm up your hands first, then start slower than feels necessary. Evenness beats speed.",
      }),
      block("flexibility-starter-metronome", "metronome", {
        bpm: 60,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 220,
      }),
      block("flexibility-starter-timer", "drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 5,
        multiRep: true,
        showLiveTimer: true,
      }),
      block("flexibility-starter-midi", "midiConnectionBar", { compact: false }),
      block("flexibility-starter-drills", "drillShortcuts", {}),
    ],
  },
  {
    id: "ten-minute-warmup",
    title: "Ten-minute warm-up",
    description:
      "Scale run, metronome, and a rest — the opening every practice routine recommends.",
    category: "technique",
    icon: AudioWaveform,
    blocks: [
      block("warmup-notes", "textBlock", {
        text: "Five to ten minutes, slow and even. Play the run hands separately first, then together. Stop before it gets tiring.",
      }),
      block("warmup-keyboard", "keyboardDisplay", {
        lowNote: 48,
        octaves: 2,
        showNoteNames: true,
        computerKeys: true,
      }),
      block("warmup-scale", "scaleRunner", {
        root: "C",
        scaleId: "major",
        span: "octave",
        pattern: "straight",
        direction: "upDown",
        requireExact: true,
        goodThreshold: 0,
        hardThreshold: 3,
      }),
      block("warmup-metronome", "metronome", {
        bpm: 60,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 160,
      }),
      block("warmup-rest", "restTimer", {
        seconds: 60,
        label: "Rest",
        chime: true,
      }),
      block("warmup-stats", "sessionStats", {
        windowDays: 7,
        showGrades: true,
        showBest: true,
      }),
    ],
  },
  {
    id: "scale-of-the-day",
    title: "Scale of the day",
    description: "One key, one scale, every day — the classic daily technique block.",
    category: "technique",
    icon: AudioWaveform,
    blocks: [
      block("scale-day-scale", "scaleRunner", {
        root: "G",
        scaleId: "major",
        span: "twoOctaves",
        pattern: "straight",
        direction: "upDown",
        requireExact: true,
        goodThreshold: 0,
        hardThreshold: 4,
      }),
      block("scale-day-metronome", "metronome", {
        bpm: 72,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 200,
      }),
      block("scale-day-timer", "drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 5,
        multiRep: true,
        showLiveTimer: true,
      }),
      block("scale-day-stats", "sessionStats", {
        windowDays: 30,
        showGrades: true,
        showBest: true,
      }),
    ],
  },
  {
    id: "five-finger-foundations",
    title: "Five-finger foundations",
    description:
      "The first five notes of a scale, one finger each. No MIDI keyboard needed.",
    category: "getting-started",
    icon: BookOpen,
    blocks: [
      block("five-finger-notes", "textBlock", {
        text: "One finger per note, thumb on C. Click the keys below or type A W S E D. Aim for even, unhurried notes — speed comes later.",
      }),
      block("five-finger-keyboard", "keyboardDisplay", {
        lowNote: 48,
        octaves: 2,
        showNoteNames: true,
        computerKeys: true,
      }),
      block("five-finger-scale", "scaleRunner", {
        root: "C",
        scaleId: "major",
        span: "pentascale",
        pattern: "straight",
        direction: "upDown",
        requireExact: true,
        goodThreshold: 0,
        hardThreshold: 4,
      }),
    ],
  },
  {
    id: "circle-of-fourths-chords",
    title: "Circle of fourths chords",
    description: "One chord shape around all twelve keys against a metronome.",
    category: "chords",
    icon: RefreshCw,
    blocks: [
      block("fourths-notes", "textBlock", {
        text: "One shape, twelve keys, in the order harmony actually moves. Start slow enough that you never guess.",
      }),
      block("fourths-cycle", "rootCycle", {
        qualityId: "maj7",
        startRoot: "C",
        order: "fourths",
        keyCount: 12,
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 3,
      }),
      block("fourths-metronome", "metronome", {
        bpm: 60,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 180,
      }),
      block("fourths-timer", "drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 5,
        multiRep: true,
        showLiveTimer: true,
      }),
      block("fourths-stats", "sessionStats", {
        windowDays: 30,
        showGrades: true,
        showBest: true,
      }),
    ],
  },
  {
    id: "ii-v-i-every-key",
    title: "ii-V-I in every key",
    description: "The most-drilled progression in jazz, transposed around the cycle.",
    category: "chords",
    icon: ListMusic,
    blocks: [
      block("ii-v-i-all-prog", "progression", {
        source: "ii-V-I",
        keyRoot: "C",
        customText: "I V vi IV",
        cycleKeys: true,
        cycleOrder: "fourths",
        keyCount: 12,
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 4,
      }),
      block("ii-v-i-all-metronome", "metronome", {
        bpm: 60,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 180,
      }),
      block("ii-v-i-all-stats", "sessionStats", {
        windowDays: 30,
        showGrades: true,
        showBest: true,
      }),
    ],
  },
  {
    id: "twelve-bar-blues",
    title: "12-bar blues",
    description: "Twelve bars of dominant sevenths — the first form worth memorising.",
    category: "chords",
    icon: ListMusic,
    blocks: [
      block("blues-notes", "textBlock", {
        text: "Four bars of I, two of IV, two of I, then V-IV-I-V. Say the bar numbers out loud until you stop needing to.",
      }),
      block("blues-prog", "progression", {
        source: "blues12",
        keyRoot: "C",
        customText: "I V vi IV",
        cycleKeys: false,
        cycleOrder: "fourths",
        keyCount: 12,
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 4,
      }),
      block("blues-metronome", "metronome", {
        bpm: 80,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 200,
      }),
      block("blues-stats", "sessionStats", {
        windowDays: 30,
        showGrades: true,
        showBest: true,
      }),
    ],
  },
  {
    id: "pop-loop",
    title: "Pop loop: I-V-vi-IV",
    description: "Four triads behind an enormous share of popular songs.",
    category: "chords",
    icon: Music2,
    blocks: [
      block("pop-notes", "textBlock", {
        text: "Four chords, endlessly looped. Once it is comfortable in C, change the key in settings and start again.",
      }),
      block("pop-prog", "progression", {
        source: "pop",
        keyRoot: "C",
        customText: "I V vi IV",
        cycleKeys: false,
        cycleOrder: "fourths",
        keyCount: 12,
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 3,
      }),
      block("pop-keyboard", "keyboardDisplay", {
        lowNote: 48,
        octaves: 2,
        showNoteNames: true,
        computerKeys: true,
      }),
      block("pop-metronome", "metronome", {
        bpm: 76,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 180,
      }),
    ],
  },
  {
    id: "minor-eleven-lap",
    title: "Minor-11th lap",
    description: "The m11 shape carried around every root, one lap at a time.",
    category: "technique",
    icon: RefreshCw,
    blocks: [
      block("m11-cycle", "rootCycle", {
        qualityId: "m11",
        startRoot: "Bb",
        order: "fourths",
        keyCount: 12,
        requireExact: false,
        goodThreshold: 1,
        hardThreshold: 4,
      }),
      block("m11-timer", "drillTimer", {
        countdownSeconds: 5,
        breakSeconds: 10,
        multiRep: true,
        showLiveTimer: true,
      }),
      block("m11-stats", "sessionStats", {
        windowDays: 30,
        showGrades: true,
        showBest: true,
      }),
    ],
  },
  {
    id: "modes-tour",
    title: "Modes tour",
    description: "Same seven notes, seven different colours — one mode per session.",
    category: "technique",
    icon: AudioWaveform,
    blocks: [
      block("modes-notes", "textBlock", {
        text: "Change the scale in settings each session: Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian. Listen for what each one does to the mood.",
      }),
      block("modes-scale", "scaleRunner", {
        root: "D",
        scaleId: "dorian",
        span: "octave",
        pattern: "straight",
        direction: "upDown",
        requireExact: true,
        goodThreshold: 0,
        hardThreshold: 3,
      }),
      block("modes-stats", "sessionStats", {
        windowDays: 30,
        showGrades: true,
        showBest: true,
      }),
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
