/**
 * What is punched into the landing page's roll.
 *
 * Pitches are MIDI note numbers; `t` (onset) and `d` (duration) are in beats
 * of paper — a beat is `--ppb` pixels tall, so time runs down the page. The
 * roll spans C3 (48) to C6 (84), one lane per semitone, like an 88-note roll
 * cut down to three octaves. The tracker bar's slots use the same lanes.
 */

export const ROLL_LOW = 48;
export const ROLL_HIGH = 84;
export const ROLL_LANES = ROLL_HIGH - ROLL_LOW + 1;

export type RollNote = {
  /** MIDI note number. */
  p: number;
  /** Onset, in beats from the top of the passage. */
  t: number;
  /** Duration in beats. */
  d: number;
  /** Velocity 0–1 (defaults to ~0.62 when played). */
  v?: number;
};

export type RollPassage = {
  notes: RollNote[];
  /** Total height of the passage, in beats. */
  beats: number;
  /** Tempo for "Hear it" playback, in beats per minute. */
  bpm: number;
  /** Beat offsets where each pass of a loop starts (the loop passage only). */
  starts?: number[];
};

export type RollPassageId =
  | "chordDrill"
  | "arpeggios"
  | "progressions"
  | "rootCycling"
  | "scale"
  | "circle"
  | "loop"
  | "penta"
  | "coda";

const N = (p: number, t: number, d: number, v?: number): RollNote => ({ p, t, d, v });
const chord = (ps: number[], t: number, d: number, v?: number) => ps.map((p) => N(p, t, d, v));

/** The lowest MIDI note at or above `floor` with pitch class `pc`. */
export function noteAbove(pc: number, floor: number): number {
  return floor + ((((pc - floor) % 12) + 12) % 12);
}

function passage(notes: RollNote[], bpm: number, pad = 0.35): RollPassage {
  const end = Math.max(...notes.map((n) => n.t + n.d));
  return { notes, bpm, beats: Math.round((end + pad) * 100) / 100 };
}

// ---- the four drills ----

const chordDrill = passage(
  [
    ...chord([62, 65, 69, 72], 0.25, 1.25), // Dm7
    ...chord([62, 65, 67, 71], 2, 1.25), //    G7
    ...chord([60, 64, 67, 71], 3.75, 1.25), // Cmaj7
    ...chord([60, 64, 67, 69], 5.5, 1.25), //  Am7
  ],
  96
);

const arpeggios = passage(
  [60, 64, 67, 72, 76, 79, 84, 79, 76, 72, 67, 64, 60].map((p, i, all) =>
    N(p, 0.25 + i * 0.4, i === all.length - 1 ? 1 : 0.34, 0.6)
  ),
  100
);

const progressions = passage(
  [
    N(50, 0.25, 1.75, 0.6), ...chord([65, 69, 72], 0.25, 1.75), // Dm7
    N(55, 2.25, 1.75, 0.6), ...chord([65, 71, 74], 2.25, 1.75), // G7
    N(48, 4.25, 2, 0.6), ...chord([64, 67, 71], 4.25, 2), //       Cmaj7
  ],
  92
);

const cycle: Array<[number, number[]]> = [
  [48, [60, 64, 67]], // C
  [53, [60, 65, 69]], // F
  [58, [62, 65, 70]], // B♭
  [51, [63, 67, 70]], // E♭
  [56, [63, 68, 72]], // A♭
  [49, [61, 65, 68]], // D♭
];
const rootCycling = passage(
  cycle.flatMap(([root, triad], i) => [
    N(root, 0.25 + i, 0.8, 0.6),
    ...chord(triad, 0.25 + i, 0.8, 0.55),
  ]),
  100
);

// ---- interludes ----

const cMajor = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84];
const scaleRun = [...cMajor, ...cMajor.slice(0, -1).reverse()];
const scale = passage(
  [
    N(48, 0, scaleRun.length * 0.25 + 0.8, 0.5),
    ...scaleRun.map((p, i) => N(p, i * 0.25, i === scaleRun.length - 1 ? 1 : 0.22, 0.55)),
  ],
  120
);

/** Twelve roots around the circle of fourths, each with its 3rd and 7th. */
const fourths = [48, 53, 58, 51, 56, 49, 54, 59, 52, 57, 50, 55];
const circle = passage(
  [
    ...fourths.flatMap((r, i) => {
      const t = 0.25 + i * 0.75;
      return [
        N(r, t, 0.65, 0.62),
        N(noteAbove((r + 4) % 12, 60), t, 0.65, 0.5),
        N(noteAbove((r + 10) % 12, 60), t, 0.65, 0.5),
      ];
    }),
    N(48, 0.25 + 12 * 0.75, 1.6, 0.6),
    N(64, 0.25 + 12 * 0.75, 1.6, 0.5),
    N(71, 0.25 + 12 * 0.75, 1.6, 0.5),
  ],
  104
);

/** A short original phrase, looped four times, a little faster each pass. */
const phrase: RollNote[] = [
  N(64, 0, 0.5), N(67, 0.5, 0.5), N(72, 1, 0.75), N(71, 1.75, 0.25),
  N(69, 2, 0.5), N(67, 2.5, 0.5), N(64, 3, 0.5), N(62, 3.5, 0.5),
  N(48, 0, 2, 0.55), N(53, 2, 1, 0.55), N(55, 3, 1, 0.55),
];
export const LOOP_TEMPI = [60, 66, 72, 80] as const;
const loop = (() => {
  const notes: RollNote[] = [];
  const starts: number[] = [];
  let offset = 0.4;
  for (const bpm of LOOP_TEMPI) {
    const scaleBy = 60 / bpm; // faster tempo → shorter on the paper
    starts.push(Math.round(offset * 1000) / 1000);
    for (const n of phrase) notes.push(N(n.p, offset + n.t * scaleBy, n.d * scaleBy, n.v));
    offset += 4 * scaleBy + 0.6;
  }
  return { ...passage(notes, 80, 0.4), starts };
})();

const penta = passage(
  [
    ...[0, 2, 4, 6].flatMap((t) => chord([57, 64], t, 1.8, 0.45)),
    N(76, 0.5, 0.5), N(79, 1, 0.5), N(81, 1.5, 1), N(79, 2.75, 0.25),
    N(76, 3, 0.5), N(74, 3.5, 0.5), N(72, 4, 0.75), N(74, 4.75, 0.25),
    N(76, 5, 1), N(72, 6.25, 0.25), N(69, 6.5, 0.5), N(67, 7, 0.5),
    N(69, 7.5, 1.5), N(57, 8, 1.5, 0.45),
  ],
  100
);

/** Cmaj9, rolled from the bottom up. */
const coda = passage(
  [48, 55, 64, 71, 74].map((p, i) => N(p, 0.2 + i * 0.18, 4 - i * 0.18, 0.55)),
  72,
  0.4
);

export const ROLL_PASSAGES: Record<RollPassageId, RollPassage> = {
  chordDrill,
  arpeggios,
  progressions,
  rootCycling,
  scale,
  circle,
  loop,
  penta,
  coda,
};

/** Indexes of the notes sounding at `beat` (half-open: onset ≤ beat < end). */
export function notesSoundingAt(p: RollPassage, beat: number): number[] {
  const out: number[] = [];
  p.notes.forEach((n, i) => {
    if (beat >= n.t && beat < n.t + n.d) out.push(i);
  });
  return out;
}

// ---- tiny motifs for the catalogue: [lane 0–11, t, d] ----

export type RollMotif = Array<[lane: number, t: number, d: number]>;
export type RollMotifId =
  | "warmup"
  | "scale"
  | "five"
  | "circle"
  | "twofive"
  | "blues"
  | "pop"
  | "modes"
  | "hanon"
  | "penta";

const seq = (lanes: number[], step: number, d: number): RollMotif =>
  lanes.map((l, i) => [l, i * step, d]);
const stacks = (list: number[][], step: number, d: number): RollMotif =>
  list.flatMap((ls, i) => ls.map((l): [number, number, number] => [l, i * step, d]));

export const ROLL_MOTIFS: Record<RollMotifId, RollMotif> = {
  warmup: seq([0, 2, 4, 5, 7, 5, 4, 2], 1, 0.8),
  scale: seq([0, 2, 4, 5, 7, 9, 11], 1.1, 0.8),
  five: seq([0, 2, 4, 5, 7, 5, 4, 2, 0], 0.88, 0.7),
  circle: seq([0, 5, 10, 3, 8, 1], 1.35, 1),
  twofive: stacks([[2, 5, 9], [5, 7, 11], [0, 4, 7, 11]], 2.7, 2.2),
  blues: seq([0, 4, 7, 9, 10, 9, 7, 4], 0.98, 0.6),
  pop: stacks([[0, 4, 7], [2, 7, 11], [0, 4, 9], [0, 5, 9]], 2, 1.6),
  modes: [
    ...seq([0, 2, 4, 5], 0.9, 0.7),
    ...seq([2, 4, 5, 7], 0.9, 0.7).map(([l, t, d]): [number, number, number] => [l, t + 4.4, d]),
  ],
  hanon: seq([0, 4, 5, 7, 9, 7, 5, 4, 2, 5, 7, 9, 11, 9, 7, 5], 0.5, 0.4),
  penta: seq([4, 7, 9, 7, 4, 2, 0, 2], 0.98, 0.8),
};
