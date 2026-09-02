import { ROOTS, SINGLE_QUALITIES, type Quality } from "../../music-theory";
import {
  KEY_CYCLE_ORDERS,
  KEY_CYCLE_ORDER_LABELS,
  type KeyCycleOrder,
} from "../../key-cycles";
import {
  MAJOR_TRIAD,
  MINOR_TRIAD,
  DIM_TRIAD,
  AUG_TRIAD,
} from "../../roman-numerals";
import {
  clamp,
  normalizeScoring,
  scoringFields,
  toEnum,
  toInt,
  type ScoringConfig,
} from "../coerce";
import type { FieldDescriptor } from "../types";

export type CycleQuality = {
  /** Stable select value; never empty, so the settings form round-trips. */
  id: string;
  label: string;
  quality: Quality;
};

/**
 * Triads first (what a beginner actually cycles), then the full 7th-and-up
 * catalogue from `music-theory`.
 */
export const CYCLE_QUALITIES: CycleQuality[] = [
  { id: "maj", label: "Major triad", quality: MAJOR_TRIAD },
  { id: "min", label: "Minor triad", quality: MINOR_TRIAD },
  { id: "dim", label: "Diminished triad", quality: DIM_TRIAD },
  { id: "aug", label: "Augmented triad", quality: AUG_TRIAD },
  ...SINGLE_QUALITIES.map((quality) => ({
    id: quality.suffix,
    label: quality.suffix,
    quality,
  })),
];

const CYCLE_QUALITY_IDS = CYCLE_QUALITIES.map((q) => q.id);
const ROOT_NAMES = ROOTS.map((r) => r.name);

export function cycleQualityById(id: string): CycleQuality {
  return CYCLE_QUALITIES.find((q) => q.id === id) ?? CYCLE_QUALITIES[0];
}

export type RootCycleConfig = ScoringConfig & {
  qualityId: string;
  startRoot: string;
  order: KeyCycleOrder;
  /** How many keys of the cycle to run (1–12). */
  keyCount: number;
};

export const rootCycleDefaultConfig: RootCycleConfig = {
  qualityId: "maj7",
  startRoot: "C",
  order: "fourths",
  keyCount: 12,
  requireExact: false,
  goodThreshold: 0,
  hardThreshold: 3,
};

export function normalizeRootCycleConfig(raw: unknown): RootCycleConfig {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  return {
    qualityId: toEnum(
      r.qualityId,
      CYCLE_QUALITY_IDS,
      rootCycleDefaultConfig.qualityId
    ),
    startRoot: toEnum(r.startRoot, ROOT_NAMES, rootCycleDefaultConfig.startRoot),
    order: toEnum(r.order, KEY_CYCLE_ORDERS, rootCycleDefaultConfig.order),
    keyCount: clamp(toInt(r.keyCount, rootCycleDefaultConfig.keyCount), 1, 12),
    ...normalizeScoring(r, rootCycleDefaultConfig),
  };
}

export const rootCycleFields: FieldDescriptor[] = [
  {
    kind: "select",
    key: "qualityId",
    label: "Chord shape",
    options: CYCLE_QUALITIES.map((q) => ({ label: q.label, value: q.id })),
    helperText: "One shape, every key — the point is finding it anywhere",
  },
  {
    kind: "select",
    key: "startRoot",
    label: "Start on",
    options: ROOT_NAMES.map((name) => ({ label: name, value: name })),
  },
  {
    kind: "select",
    key: "order",
    label: "Cycle order",
    options: KEY_CYCLE_ORDERS.map((order) => ({
      label: KEY_CYCLE_ORDER_LABELS[order],
      value: order,
    })),
  },
  {
    kind: "range",
    key: "keyCount",
    label: "Keys per round",
    min: 1,
    max: 12,
    step: 1,
  },
  ...scoringFields,
];
