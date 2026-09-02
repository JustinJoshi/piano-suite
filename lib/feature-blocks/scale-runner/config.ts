import { ROOTS } from "../../music-theory";
import {
  SCALE_TYPES,
  SCALE_SPANS,
  SCALE_PATTERNS,
  SCALE_DIRECTIONS,
  type ScaleSpan,
  type ScalePattern,
  type ScaleDirection,
} from "../../scales";
import {
  normalizeScoring,
  scoringFields,
  toEnum,
  type ScoringConfig,
} from "../coerce";
import type { FieldDescriptor } from "../types";

export type ScaleRunnerConfig = ScoringConfig & {
  root: string;
  scaleId: string;
  span: ScaleSpan;
  pattern: ScalePattern;
  direction: ScaleDirection;
};

const ROOT_NAMES = ROOTS.map((r) => r.name);
const SCALE_IDS = SCALE_TYPES.map((s) => s.id);

/**
 * A one-octave C major run, up and down. `requireExact` defaults to **true**
 * here (unlike the chord set): a scale step is a single note, and subset
 * matching would let any chord containing that note pass.
 */
export const scaleRunnerDefaultConfig: ScaleRunnerConfig = {
  root: "C",
  scaleId: "major",
  span: "octave",
  pattern: "straight",
  direction: "upDown",
  requireExact: true,
  goodThreshold: 0,
  hardThreshold: 3,
};

export function normalizeScaleRunnerConfig(raw: unknown): ScaleRunnerConfig {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  return {
    root: toEnum(r.root, ROOT_NAMES, scaleRunnerDefaultConfig.root),
    scaleId: toEnum(r.scaleId, SCALE_IDS, scaleRunnerDefaultConfig.scaleId),
    span: toEnum(r.span, SCALE_SPANS, scaleRunnerDefaultConfig.span),
    pattern: toEnum(r.pattern, SCALE_PATTERNS, scaleRunnerDefaultConfig.pattern),
    direction: toEnum(
      r.direction,
      SCALE_DIRECTIONS,
      scaleRunnerDefaultConfig.direction
    ),
    ...normalizeScoring(r, scaleRunnerDefaultConfig),
  };
}

export const scaleRunnerFields: FieldDescriptor[] = [
  {
    kind: "select",
    key: "root",
    label: "Root",
    options: ROOT_NAMES.map((name) => ({ label: name, value: name })),
  },
  {
    kind: "select",
    key: "scaleId",
    label: "Scale",
    options: SCALE_TYPES.map((s) => ({ label: s.label, value: s.id })),
  },
  {
    kind: "select",
    key: "span",
    label: "Range",
    options: [
      { label: "Five-finger (degrees 1–5)", value: "pentascale" },
      { label: "One octave", value: "octave" },
      { label: "Two octaves", value: "twoOctaves" },
    ],
  },
  {
    kind: "select",
    key: "pattern",
    label: "Pattern",
    options: [
      { label: "Straight", value: "straight" },
      { label: "Broken thirds", value: "thirds" },
      { label: "Broken triads", value: "triads" },
    ],
    helperText: "Thirds and triads are the classic finger-independence shapes",
  },
  {
    kind: "select",
    key: "direction",
    label: "Direction",
    options: [
      { label: "Up", value: "up" },
      { label: "Down", value: "down" },
      { label: "Up and down", value: "upDown" },
    ],
  },
  ...scoringFields,
];
