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
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
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
  {
    id: "hanon-cell-lab",
    title: "Hanon cell, falling notes",
    authorName: "Justin",
    authorNote:
      "I always abandoned Hanon books until the drill played itself back at me. Watching my own cell fall toward the hit line at 60 is the first time I practised it more than three days running.",
    blocks: [
      block("scaleLibrary", {
        scale: "major",
        root: "C",
        span: "twoOctaves",
        pattern: "custom",
        customCell: "1235",
        direction: "upDown",
        hands: "right",
        loopCount: 2,
        metronomeAdvanced: false,
      }),
      block("rhythmPattern", {
        leftPattern: "1000",
        rightPattern: "0100",
        barsPerCycle: 1,
        durationRatio: 0.5,
      }),
      block("transport", {
        bpm: 60,
        beatsPerBar: 4,
        countInBars: 1,
        loopEnabled: false,
        loopStartBar: 0,
        loopEndBar: 8,
        rampEnabled: false,
        rampTargetBpm: 80,
      }),
      block("noteRoll", {
        lookaheadMs: 2500,
        scrollSpeed: 200,
        handFilter: "right",
        showNoteNames: true,
        waitMode: true,
      }),
      block("sessionStats", {
        windowDays: 30,
        showGrades: false,
        showBest: true,
        showDays: true,
      }),
    ],
  },
  {
    id: "rootless-ii-v-i-slow",
    title: "Rootless ii-V-I, no metronome",
    authorName: "Justin",
    authorNote:
      "I could voice ii-V-I but panicked whenever a tempo was attached. This is the page that decoupled the two for me: the shapes, twelve keys in a loop, and no clock anywhere telling me to hurry.",
    blocks: [
      block("chordLibrary", {
        mode: "romanNumerals",
        numerals: "ii7 V7 Imaj7",
        keyRoot: "C",
        voicing: "rootlessA",
        showNext: true,
        loopCount: 12,
      }),
      block("targetDisplay", {
        view: "keysDiagram",
        showNext: true,
        showPosition: true,
      }),
      block("drillTimer", {
        countdownSeconds: 0,
        breakSeconds: 0,
        multiRep: true,
        showLiveTimer: true,
      }),
      block("sessionStats", {
        windowDays: 30,
        showGrades: true,
        showBest: true,
      }),
    ],
  },
  {
    id: "pentatonic-scope",
    title: "Pentatonic scope",
    authorName: "Justin",
    authorNote:
      "Improvising used to feel like being graded with no answer key. Five notes, a live readout instead of a score, and a keyboard that rings the scale — this is where I let myself just play.",
    blocks: [
      block("scaleLibrary", {
        scale: "majorPentatonic",
        root: "C",
        span: "octave",
        pattern: "straight",
        direction: "up",
        hands: "right",
        loopCount: 1,
        metronomeAdvanced: false,
      }),
      block("freePlay", {
        scale: "majorPentatonic",
        root: "C",
        windowSeconds: 30,
      }),
      block("keyboardDisplay", {
        lowNote: 48,
        octaves: 2,
        showNoteNames: true,
        computerKeys: true,
        highlightScale: "majorPentatonic",
        highlightRoot: "C",
      }),
    ],
  },
];
