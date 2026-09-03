import {
  Timer,
  Hourglass,
  Music,
  Type,
  Cable,
  Zap,
  Piano,
  AudioWaveform,
  RefreshCw,
  ListMusic,
  BarChart3,
  Coffee,
  Gauge,
  Music4,
  Crosshair,
  Layers,
  Activity,
  Disc3,
  Film,
} from "lucide-react";
import { MetronomeBlock } from "@/components/feature-blocks/metronome-block";
import { DrillTimerBlock } from "@/components/feature-blocks/drill-timer-block";
import { ChordSetBlock } from "@/components/feature-blocks/chord-set-block";
import { TextBlock } from "@/components/feature-blocks/text-block";
import { MidiConnectionBarBlock } from "@/components/feature-blocks/midi-connection-bar-block";
import { DrillShortcutsBlock } from "@/components/feature-blocks/drill-shortcuts-block";
import { KeyboardDisplayBlock } from "@/components/feature-blocks/keyboard-display-block";
import { ScaleRunnerBlock } from "@/components/feature-blocks/scale-runner-block";
import { RootCycleBlock } from "@/components/feature-blocks/root-cycle-block";
import { ProgressionBlock } from "@/components/feature-blocks/progression-block";
import { SessionStatsBlock } from "@/components/feature-blocks/session-stats-block";
import { RestTimerBlock } from "@/components/feature-blocks/rest-timer-block";
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
import {
  textBlockDefaultConfig,
  normalizeTextBlockConfig,
  textBlockFields,
} from "@/lib/feature-blocks/text-block/config";
import {
  midiConnectionBarDefaultConfig,
  normalizeMidiConnectionBarConfig,
  midiConnectionBarFields,
} from "@/lib/feature-blocks/midi-connection-bar/config";
import {
  drillShortcutsDefaultConfig,
  normalizeDrillShortcutsConfig,
  drillShortcutsFields,
} from "@/lib/feature-blocks/drill-shortcuts/config";
import {
  keyboardDisplayDefaultConfig,
  normalizeKeyboardDisplayConfig,
  keyboardDisplayFields,
} from "@/lib/feature-blocks/keyboard-display/config";
import {
  scaleRunnerDefaultConfig,
  normalizeScaleRunnerConfig,
  scaleRunnerFields,
} from "@/lib/feature-blocks/scale-runner/config";
import {
  rootCycleDefaultConfig,
  normalizeRootCycleConfig,
  rootCycleFields,
} from "@/lib/feature-blocks/root-cycle/config";
import {
  progressionDefaultConfig,
  normalizeProgressionBlockConfig,
  progressionFields,
} from "@/lib/feature-blocks/progression/config";
import {
  sessionStatsDefaultConfig,
  normalizeSessionStatsConfig,
  sessionStatsFields,
} from "@/lib/feature-blocks/session-stats/config";
import {
  restTimerDefaultConfig,
  normalizeRestTimerConfig,
  restTimerFields,
} from "@/lib/feature-blocks/rest-timer/config";
import {
  transportDefaultConfig,
  normalizeTransportConfig,
  transportFields,
} from "@/lib/feature-blocks/transport/config";
import {
  rhythmPatternDefaultConfig,
  normalizeRhythmPatternConfig,
  rhythmPatternFields,
} from "@/lib/feature-blocks/rhythm-pattern/config";
import { TransportBlock } from "@/components/feature-blocks/transport-block";
import { RhythmPatternBlock } from "@/components/feature-blocks/rhythm-pattern-block";
import {
  targetDisplayDefaultConfig,
  normalizeTargetDisplayConfig,
  targetDisplayFields,
} from "@/lib/feature-blocks/target-display/config";
import {
  chordLibraryDefaultConfig,
  normalizeChordLibraryConfig,
  chordLibraryFields,
} from "@/lib/feature-blocks/chord-library/config";
import {
  scaleLibraryDefaultConfig,
  normalizeScaleLibraryConfig,
  scaleLibraryFields,
} from "@/lib/feature-blocks/scale-library/config";
import { TargetDisplayBlock } from "@/components/feature-blocks/target-display-block";
import { ChordLibraryBlock } from "@/components/feature-blocks/chord-library-block";
import { ScaleLibraryBlock } from "@/components/feature-blocks/scale-library-block";
import {
  noteRollDefaultConfig,
  normalizeNoteRollConfig,
  noteRollFields,
} from "@/lib/feature-blocks/note-roll/config";
import {
  pieceLibraryDefaultConfig,
  normalizePieceLibraryConfig,
  pieceLibraryFields,
} from "@/lib/feature-blocks/piece-library/config";
import { NoteRollBlock } from "@/components/feature-blocks/note-roll-block";
import { PieceLibraryBlock } from "@/components/feature-blocks/piece-library-block";
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
    provides: "targets",
    maxPerPage: 1,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  textBlock: {
    type: "textBlock",
    category: "technique",
    label: "Instructions",
    description: "Add text instructions or notes to your practice page.",
    icon: Type,
    fields: textBlockFields,
    defaultConfig: textBlockDefaultConfig,
    normalizeConfig: normalizeTextBlockConfig,
    component: TextBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  midiConnectionBar: {
    type: "midiConnectionBar",
    category: "rhythm",
    label: "MIDI connection",
    description: "Show a MIDI keyboard connection status bar.",
    icon: Cable,
    fields: midiConnectionBarFields,
    defaultConfig: midiConnectionBarDefaultConfig,
    normalizeConfig: normalizeMidiConnectionBarConfig,
    component: MidiConnectionBarBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  drillShortcuts: {
    type: "drillShortcuts",
    category: "technique",
    label: "Ready-made drills",
    description: "Jump straight into a guided drill from your page.",
    icon: Zap,
    fields: drillShortcutsFields,
    defaultConfig: drillShortcutsDefaultConfig,
    normalizeConfig: normalizeDrillShortcutsConfig,
    component: DrillShortcutsBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  keyboardDisplay: {
    type: "keyboardDisplay",
    category: "technique",
    label: "On-screen keyboard",
    description:
      "Play with clicks, touches, or your computer keys — no MIDI controller needed.",
    icon: Piano,
    fields: keyboardDisplayFields,
    defaultConfig: keyboardDisplayDefaultConfig,
    normalizeConfig: normalizeKeyboardDisplayConfig,
    component: KeyboardDisplayBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  scaleRunner: {
    type: "scaleRunner",
    category: "technique",
    label: "Scale run",
    description:
      "Scales, modes, and five-finger patterns as a timed run of single notes.",
    icon: AudioWaveform,
    fields: scaleRunnerFields,
    defaultConfig: scaleRunnerDefaultConfig,
    normalizeConfig: normalizeScaleRunnerConfig,
    component: ScaleRunnerBlock as ComponentType<Record<string, unknown>>,
    provides: "targets",
    maxPerPage: 1,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  rootCycle: {
    type: "rootCycle",
    category: "theory",
    label: "Key cycle",
    description:
      "Take one chord shape around the circle of fourths, fifths, or all twelve keys.",
    icon: RefreshCw,
    fields: rootCycleFields,
    defaultConfig: rootCycleDefaultConfig,
    normalizeConfig: normalizeRootCycleConfig,
    component: RootCycleBlock as ComponentType<Record<string, unknown>>,
    provides: "targets",
    maxPerPage: 1,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  progression: {
    type: "progression",
    category: "theory",
    label: "Progression",
    description:
      "ii-V-I, 12-bar blues, a pop loop, or your own roman numerals — in one key or every key.",
    icon: ListMusic,
    fields: progressionFields,
    defaultConfig: progressionDefaultConfig,
    normalizeConfig: normalizeProgressionBlockConfig,
    component: ProgressionBlock as ComponentType<Record<string, unknown>>,
    provides: "targets",
    maxPerPage: 1,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  sessionStats: {
    type: "sessionStats",
    category: "progress",
    label: "Session stats",
    description: "Reps, speed, and grades for this practice page.",
    icon: BarChart3,
    fields: sessionStatsFields,
    defaultConfig: sessionStatsDefaultConfig,
    normalizeConfig: normalizeSessionStatsConfig,
    component: SessionStatsBlock as ComponentType<Record<string, unknown>>,
    maxPerPage: 1,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  restTimer: {
    type: "restTimer",
    category: "rhythm",
    label: "Rest timer",
    description: "Count down a rest between sets so a session stays time-boxed.",
    icon: Coffee,
    fields: restTimerFields,
    defaultConfig: restTimerDefaultConfig,
    normalizeConfig: normalizeRestTimerConfig,
    component: RestTimerBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  transport: {
    type: "transport",
    category: "rhythm",
    label: "Transport",
    description:
      "The page clock: tempo, meter, count-in, loop, and a tempo ramp with an audible tick.",
    icon: Gauge,
    fields: transportFields,
    defaultConfig: transportDefaultConfig,
    normalizeConfig: normalizeTransportConfig,
    component: TransportBlock as ComponentType<Record<string, unknown>>,
    maxPerPage: 1,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  rhythmPattern: {
    type: "rhythmPattern",
    category: "rhythm",
    label: "Rhythm pattern",
    description:
      "Place incoming notes on a per-hand onset grid and shape articulation.",
    icon: Music4,
    fields: rhythmPatternFields,
    defaultConfig: rhythmPatternDefaultConfig,
    normalizeConfig: normalizeRhythmPatternConfig,
    component: RhythmPatternBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  targetDisplay: {
    type: "targetDisplay",
    category: "technique",
    label: "Target display",
    description: "Show the chords or notes to play now, as symbols or a keys diagram.",
    icon: Crosshair,
    fields: targetDisplayFields,
    defaultConfig: targetDisplayDefaultConfig,
    normalizeConfig: normalizeTargetDisplayConfig,
    component: TargetDisplayBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  chordLibrary: {
    type: "chordLibrary",
    category: "theory",
    label: "Chord library",
    description:
      "A chord stream from symbols or roman numerals, in closed or rootless voicings.",
    icon: Layers,
    fields: chordLibraryFields,
    defaultConfig: chordLibraryDefaultConfig,
    normalizeConfig: normalizeChordLibraryConfig,
    component: ChordLibraryBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  scaleLibrary: {
    type: "scaleLibrary",
    category: "technique",
    label: "Scale library",
    description:
      "Scale runs in any key, span, and direction — plus custom Hanon-style cells.",
    icon: Activity,
    fields: scaleLibraryFields,
    defaultConfig: scaleLibraryDefaultConfig,
    normalizeConfig: normalizeScaleLibraryConfig,
    component: ScaleLibraryBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  noteRoll: {
    type: "noteRoll",
    category: "visualization",
    label: "Note roll",
    description:
      "Falling notes over a hit line — practice a piece or rhythm in time.",
    icon: Disc3,
    fields: noteRollFields,
    defaultConfig: noteRollDefaultConfig,
    normalizeConfig: normalizeNoteRollConfig,
    component: NoteRollBlock as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
  pieceLibrary: {
    type: "pieceLibrary",
    category: "technique",
    label: "Piece library",
    description:
      "Upload a MIDI file and practice it with hand filters and transpose.",
    icon: Film,
    fields: pieceLibraryFields,
    defaultConfig: pieceLibraryDefaultConfig,
    normalizeConfig: normalizePieceLibraryConfig,
    component: PieceLibraryBlock as ComponentType<Record<string, unknown>>,
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
  { id: "progress", label: "Progress" },
  { id: "visualization", label: "Visualization" },
] as const;

/**
 * How many copies of a block a page may hold. `Infinity` when unconstrained.
 */
export function maxPerPage(type: string): number {
  // `satisfies` narrows each entry to its own literal type, so the registry
  // union does not carry the optional fields — widen before reading them.
  const def = getFeatureDefinition(type) as FeatureDefinition<
    Record<string, unknown>
  > | null;
  return def?.maxPerPage ?? Infinity;
}

/** True when the page already holds as many of `type` as it may. */
export function isAtBlockLimit(
  blocks: readonly { type: string }[],
  type: string
): boolean {
  return blocks.filter((b) => b.type === type).length >= maxPerPage(type);
}
