/**
 * Minor-11th arpeggio drill vocabulary and persisted settings.
 *
 * The 12 cells below come from Reflex Drill EXT. They are expressed as
 * generic SequenceDrill values so the same engine can later drive custom
 * user-generated sequence drills.
 */

import {
  type SequenceDrill,
  type SequenceConfig,
  type MissThresholds,
  normalizeSequenceConfig,
} from "@/lib/sequence-drill";

export type ArpeggioSettings = {
  flashOnMiss: boolean;
  showLh: boolean;
  lapChime: boolean;
  config: SequenceConfig;
  countdownSeconds: number;
  breakSeconds: number;
  breakTickSound: boolean;
  missThresholds: MissThresholds;
};

export const ARPEGGIO_CHORDS: SequenceDrill[] = [
  {
    id: "Bbm11",
    lh: [
      { name: "Bb", pc: 10 },
      { name: "F", pc: 5 },
      { name: "Ab", pc: 8 },
    ],
    rh: [
      { name: "C", pc: 0, deg: "9" },
      { name: "Db", pc: 1, deg: "b3" },
      { name: "Eb", pc: 3, deg: "11" },
      { name: "F", pc: 5, deg: "5" },
      { name: "Ab", pc: 8, deg: "b7" },
      { name: "C", pc: 0, deg: "9" },
      { name: "Eb", pc: 3, deg: "11" },
    ],
  },
  {
    id: "Fm11",
    lh: [
      { name: "F", pc: 5 },
      { name: "C", pc: 0 },
      { name: "Eb", pc: 3 },
    ],
    rh: [
      { name: "G", pc: 7, deg: "9" },
      { name: "Ab", pc: 8, deg: "b3" },
      { name: "Bb", pc: 10, deg: "11" },
      { name: "C", pc: 0, deg: "5" },
      { name: "Eb", pc: 3, deg: "b7" },
      { name: "G", pc: 7, deg: "9" },
      { name: "Bb", pc: 10, deg: "11" },
    ],
  },
  {
    id: "Abm11",
    lh: [
      { name: "Ab", pc: 8 },
      { name: "Eb", pc: 3 },
      { name: "Gb", pc: 6 },
    ],
    rh: [
      { name: "Bb", pc: 10, deg: "9" },
      { name: "Cb", pc: 11, deg: "b3" },
      { name: "Db", pc: 1, deg: "11" },
      { name: "Eb", pc: 3, deg: "5" },
      { name: "Gb", pc: 6, deg: "b7" },
      { name: "Bb", pc: 10, deg: "9" },
      { name: "Db", pc: 1, deg: "11" },
    ],
  },
  {
    id: "Ebm11",
    lh: [
      { name: "Eb", pc: 3 },
      { name: "Bb", pc: 10 },
    ],
    rh: [
      { name: "F", pc: 5, deg: "9" },
      { name: "Gb", pc: 6, deg: "b3" },
      { name: "Ab", pc: 8, deg: "11" },
      { name: "Bb", pc: 10, deg: "5" },
      { name: "Db", pc: 1, deg: "b7" },
      { name: "F", pc: 5, deg: "9" },
      { name: "Ab", pc: 8, deg: "11" },
    ],
  },
  {
    id: "F#m11",
    lh: [
      { name: "F#", pc: 6 },
      { name: "E", pc: 4 },
    ],
    rh: [
      { name: "G#", pc: 8, deg: "9" },
      { name: "A", pc: 9, deg: "b3" },
      { name: "B", pc: 11, deg: "11" },
      { name: "C#", pc: 1, deg: "5" },
      { name: "E", pc: 4, deg: "b7" },
      { name: "G#", pc: 8, deg: "9" },
      { name: "B", pc: 11, deg: "11" },
    ],
  },
  {
    id: "C#m11",
    lh: [
      { name: "C#", pc: 1 },
      { name: "Ab(G#)", pc: 8 },
    ],
    rh: [
      { name: "D#", pc: 3, deg: "9" },
      { name: "E", pc: 4, deg: "b3" },
      { name: "F#", pc: 6, deg: "11" },
      { name: "G#", pc: 8, deg: "5" },
      { name: "B", pc: 11, deg: "b7" },
      { name: "D#", pc: 3, deg: "9" },
      { name: "F#", pc: 6, deg: "11" },
    ],
  },
  {
    id: "Em11",
    lh: [
      { name: "E", pc: 4 },
      { name: "B", pc: 11 },
    ],
    rh: [
      { name: "F#", pc: 6, deg: "9" },
      { name: "G", pc: 7, deg: "b3" },
      { name: "A", pc: 9, deg: "11" },
      { name: "B", pc: 11, deg: "5" },
      { name: "D", pc: 2, deg: "b7" },
      { name: "F#", pc: 6, deg: "9" },
      { name: "A", pc: 9, deg: "11" },
    ],
  },
  {
    id: "Bm11",
    lh: [
      { name: "B", pc: 11 },
      { name: "F#(Gb)", pc: 6 },
    ],
    rh: [
      { name: "C#", pc: 1, deg: "9" },
      { name: "D", pc: 2, deg: "b3" },
      { name: "E", pc: 4, deg: "11" },
      { name: "F#", pc: 6, deg: "5" },
      { name: "A", pc: 9, deg: "b7" },
      { name: "C#", pc: 1, deg: "9" },
      { name: "E", pc: 4, deg: "11" },
    ],
  },
  {
    id: "Dm11",
    lh: [
      { name: "D", pc: 2 },
      { name: "A", pc: 9 },
    ],
    rh: [
      { name: "E", pc: 4, deg: "9" },
      { name: "F", pc: 5, deg: "b3" },
      { name: "G", pc: 7, deg: "11" },
      { name: "A", pc: 9, deg: "5" },
      { name: "C", pc: 0, deg: "b7" },
      { name: "E", pc: 4, deg: "9" },
      { name: "G", pc: 7, deg: "11" },
    ],
  },
  {
    id: "Am11",
    lh: [
      { name: "A", pc: 9 },
      { name: "E", pc: 4 },
      { name: "G", pc: 7 },
    ],
    rh: [
      { name: "B", pc: 11, deg: "9" },
      { name: "C", pc: 0, deg: "b3" },
      { name: "D", pc: 2, deg: "11" },
      { name: "E", pc: 4, deg: "5" },
      { name: "G", pc: 7, deg: "b7" },
      { name: "B", pc: 11, deg: "9" },
      { name: "D", pc: 2, deg: "11" },
    ],
  },
  {
    id: "Cm11",
    lh: [
      { name: "C", pc: 0 },
      { name: "G", pc: 7 },
    ],
    rh: [
      { name: "D", pc: 2, deg: "9" },
      { name: "Eb", pc: 3, deg: "b3" },
      { name: "F", pc: 5, deg: "11" },
      { name: "G", pc: 7, deg: "5" },
      { name: "Bb", pc: 10, deg: "b7" },
      { name: "D", pc: 2, deg: "9" },
      { name: "F", pc: 5, deg: "11" },
    ],
  },
  {
    id: "Gm11",
    lh: [
      { name: "G", pc: 7 },
      { name: "D", pc: 2 },
      { name: "F", pc: 5 },
    ],
    rh: [
      { name: "A", pc: 9, deg: "9" },
      { name: "Bb", pc: 10, deg: "b3" },
      { name: "C", pc: 0, deg: "11" },
      { name: "D", pc: 2, deg: "5" },
      { name: "F", pc: 5, deg: "b7" },
      { name: "A", pc: 9, deg: "9" },
      { name: "C", pc: 0, deg: "11" },
    ],
  },
];

export const DEFAULT_ORDER = ARPEGGIO_CHORDS.map((c) => c.id);

export const ARPEGGIO_SETTINGS_KEY = "arpeggio-settings-v1";

const DEFAULT_THRESHOLDS: MissThresholds = { good: 0, hard: 2 };

export const DEFAULT_ARPEGGIO_SETTINGS: ArpeggioSettings = {
  flashOnMiss: true,
  showLh: true,
  lapChime: false,
  config: { order: DEFAULT_ORDER.slice(), excluded: [] },
  countdownSeconds: 3,
  breakSeconds: 0,
  breakTickSound: true,
  missThresholds: { ...DEFAULT_THRESHOLDS },
};

/**
 * Find the arpeggio whose root matches the given pitch class.
 */
export function findArpeggioByRootPc(pc: number): SequenceDrill | null {
  return ARPEGGIO_CHORDS.find((c) => c.lh[0]?.pc === pc) ?? null;
}

function clamp(n: unknown, min: number, max: number, fallback: number): number {
  const val = Number(n);
  return Number.isFinite(val) ? Math.max(min, Math.min(max, val)) : fallback;
}

/**
 * Clamp and validate raw arpeggio settings loaded from persistent storage.
 */
export function normalizeArpeggioSettings(
  raw: Partial<ArpeggioSettings>
): ArpeggioSettings {
  const config = normalizeSequenceConfig(
    raw.config?.order,
    DEFAULT_ORDER
  );
  if (Array.isArray(raw.config?.excluded)) {
    config.excluded = raw.config.excluded.filter((id) =>
      DEFAULT_ORDER.includes(id)
    );
  }

  const good = clamp(
    raw.missThresholds?.good,
    0,
    99,
    DEFAULT_THRESHOLDS.good
  );
  const hard = clamp(
    raw.missThresholds?.hard,
    good,
    99,
    Math.max(good, DEFAULT_THRESHOLDS.hard)
  );

  return {
    flashOnMiss:
      typeof raw.flashOnMiss === "boolean"
        ? raw.flashOnMiss
        : DEFAULT_ARPEGGIO_SETTINGS.flashOnMiss,
    showLh:
      typeof raw.showLh === "boolean"
        ? raw.showLh
        : DEFAULT_ARPEGGIO_SETTINGS.showLh,
    lapChime:
      typeof raw.lapChime === "boolean"
        ? raw.lapChime
        : DEFAULT_ARPEGGIO_SETTINGS.lapChime,
    config,
    countdownSeconds: clamp(
      raw.countdownSeconds,
      1,
      30,
      DEFAULT_ARPEGGIO_SETTINGS.countdownSeconds
    ),
    breakSeconds: clamp(
      raw.breakSeconds,
      0,
      60,
      DEFAULT_ARPEGGIO_SETTINGS.breakSeconds
    ),
    breakTickSound:
      typeof raw.breakTickSound === "boolean"
        ? raw.breakTickSound
        : DEFAULT_ARPEGGIO_SETTINGS.breakTickSound,
    missThresholds: { good, hard },
  };
}
