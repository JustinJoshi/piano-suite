import type { FeatureBlock } from "@/lib/feature-blocks/types";

/**
 * Featured pages that ship with the app so the marketplace is never an
 * empty room (audit 2026-09, Phase 3.3). Authored in first person — these
 * are practice pages I actually use, and the notes say why.
 *
 * Blocks use the same shape as any stored page; copying runs them through
 * `normalizeStoredBlock`, so invalid content cannot sneak in via seeds
 * either.
 */
export type MarketplaceSeed = {
  /** Stable slug used as the React key and fork lineage marker. */
  id: string;
  title: string;
  authorName: string;
  /** First-person why-this-page-exists note, shown on the card. */
  authorNote: string;
  blocks: FeatureBlock[];
};

const ALL_ROOTS = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

function block(
  type: string,
  config: Record<string, unknown>
): FeatureBlock {
  return { id: type, type, version: 1, config };
}

export const marketplaceSeeds: MarketplaceSeed[] = [
  {
    id: "first-chords",
    title: "Play your first Cmaj7",
    authorName: "Justin",
    authorNote:
      "The very first page I hand to friends. No MIDI keyboard needed — click the keys or type A W S E D.",
    blocks: [
      block("textBlock", {
        text: "Click the keys below (or type A W S E D F T G Y H U J). Play all four notes of the chord together — C E G B.",
      }),
      block("keyboardDisplay", {
        lowNote: 48,
        octaves: 2,
        showNoteNames: true,
        computerKeys: true,
      }),
      block("chordSet", {
        roots: ["C"],
        qualityGroups: ["7th"],
        order: "sequential",
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 2,
      }),
    ],
  },
  {
    id: "five-minute-warmup",
    title: "Five-minute warm-up",
    authorName: "Justin",
    authorNote:
      "How I start every practice session: three roots, random order, no way to predict the next chord.",
    blocks: [
      block("drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 5,
        multiRep: true,
        showLiveTimer: true,
      }),
      block("chordSet", {
        roots: ["C", "F", "G"],
        qualityGroups: ["7th"],
        order: "random",
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 2,
      }),
      block("keyboardDisplay", {
        lowNote: 48,
        octaves: 2,
        showNoteNames: true,
        computerKeys: true,
      }),
    ],
  },
  {
    id: "twelve-keys",
    title: "All twelve keys challenge",
    authorName: "Justin",
    authorNote:
      "Once a week I run this to keep every key equally familiar. One miss is still a Good day.",
    blocks: [
      block("drillTimer", {
        countdownSeconds: 5,
        breakSeconds: 10,
        multiRep: true,
        showLiveTimer: true,
      }),
      block("chordSet", {
        roots: ALL_ROOTS,
        qualityGroups: ["7th"],
        order: "random",
        requireExact: false,
        goodThreshold: 1,
        hardThreshold: 3,
      }),
      block("keyboardDisplay", {
        lowNote: 48,
        octaves: 2,
        showNoteNames: false,
        computerKeys: true,
      }),
    ],
  },
  {
    id: "metronome-basics",
    title: "Metronome basics: steady quarters",
    authorName: "Justin",
    authorNote:
      "Slower than feels comfortable is the point. I set 60 BPM and play one chord per click.",
    blocks: [
      block("textBlock", {
        text: "Set the tempo slower than feels comfortable. Play one chord on each click. If you rush, slow down 10 BPM and start over — that is the whole exercise.",
      }),
      block("metronome", {
        bpm: 60,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 160,
      }),
    ],
  },
  {
    id: "left-hand-day",
    title: "Left-hand day",
    authorName: "Justin",
    authorNote:
      "My left hand gets its own page. The keyboard starts at C2 and the drills live low.",
    blocks: [
      block("drillTimer", {
        countdownSeconds: 3,
        breakSeconds: 5,
        multiRep: true,
        showLiveTimer: true,
      }),
      block("chordSet", {
        roots: ["C", "G", "D", "A"],
        qualityGroups: ["7th"],
        order: "sequential",
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 2,
      }),
      block("keyboardDisplay", {
        lowNote: 36,
        octaves: 2,
        showNoteNames: true,
        computerKeys: true,
      }),
    ],
  },
  {
    id: "daily-hub",
    title: "Daily hub",
    authorName: "Justin",
    authorNote:
      "The page I leave open: quick jumps into the ready-made drills, plus a metronome always in reach.",
    blocks: [
      block("drillShortcuts", {}),
      block("metronome", {
        bpm: 120,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 220,
      }),
    ],
  },

  {
    id: "ten-minute-warmup",
    title: "My ten-minute warm-up",
    authorName: "Justin",
    authorNote:
      "How I open every session: one octave of C major up and down at 60, then a minute of rest before I touch anything hard.",
    blocks: [
      block("textBlock", {
        text: "Slow and even beats fast and ragged. Play the run hands separately first, then together. Stop before it gets tiring.",
      }),
      block("scaleRunner", {
        root: "C",
        scaleId: "major",
        span: "octave",
        pattern: "straight",
        direction: "upDown",
        requireExact: true,
        goodThreshold: 0,
        hardThreshold: 3,
      }),
      block("metronome", {
        bpm: 60,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 160,
      }),
      block("restTimer", { seconds: 60, label: "Rest", chime: true }),
      block("sessionStats", {
        windowDays: 7,
        showGrades: true,
        showBest: true,
      }),
    ],
  },
  {
    id: "five-finger-start",
    title: "Five-finger start",
    authorName: "Justin",
    authorNote:
      "What I hand someone on day one. Five notes, one finger each, no MIDI keyboard required — click or type A W S E D.",
    blocks: [
      block("textBlock", {
        text: "Thumb on C, one finger per note. Even and unhurried. Speed is not the goal today.",
      }),
      block("keyboardDisplay", {
        lowNote: 48,
        octaves: 2,
        showNoteNames: true,
        computerKeys: true,
      }),
      block("scaleRunner", {
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
    id: "circle-of-fourths",
    title: "Circle of fourths, one shape",
    authorName: "Justin",
    authorNote:
      "Twelve keys in the order harmony actually moves. I set the metronome slow enough that I never have to guess.",
    blocks: [
      block("rootCycle", {
        qualityId: "maj7",
        startRoot: "C",
        order: "fourths",
        keyCount: 12,
        requireExact: false,
        goodThreshold: 0,
        hardThreshold: 3,
      }),
      block("metronome", {
        bpm: 60,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 180,
      }),
      block("sessionStats", {
        windowDays: 30,
        showGrades: true,
        showBest: true,
      }),
    ],
  },
  {
    id: "ii-v-i-cycle",
    title: "ii-V-I around the cycle",
    authorName: "Justin",
    authorNote:
      "Thirty-six chords, twelve keys, one shape. This is the page that finally made ii-V-I automatic for me.",
    blocks: [
      block("progression", {
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
      block("metronome", {
        bpm: 60,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 180,
      }),
      block("sessionStats", {
        windowDays: 30,
        showGrades: true,
        showBest: true,
      }),
    ],
  },
  {
    id: "pop-four-chords",
    title: "The four chords",
    authorName: "Justin",
    authorNote:
      "I-V-vi-IV. Learn it in C, then change the key in settings and learn it again — that is most of pop piano.",
    blocks: [
      block("progression", {
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
      block("keyboardDisplay", {
        lowNote: 48,
        octaves: 2,
        showNoteNames: true,
        computerKeys: true,
      }),
      block("metronome", {
        bpm: 76,
        beatsPerBar: 4,
        accentFirstBeat: true,
        minBpm: 40,
        maxBpm: 180,
      }),
    ],
  },
];
