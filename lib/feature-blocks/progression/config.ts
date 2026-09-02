import { ROOTS } from "../../music-theory";
import {
  KEY_CYCLE_ORDERS,
  KEY_CYCLE_ORDER_LABELS,
  type KeyCycleOrder,
} from "../../key-cycles";
import {
  clamp,
  normalizeScoring,
  scoringFields,
  toBool,
  toEnum,
  toInt,
  toText,
  type ScoringConfig,
} from "../coerce";
import type { FieldDescriptor } from "../types";

export const PROGRESSION_SOURCES = ["ii-V-I", "blues12", "pop", "custom"] as const;
export type ProgressionSource = (typeof PROGRESSION_SOURCES)[number];

/**
 * Roman numerals for the built-in presets. Keeping them as text (rather than
 * a second code path) means every preset is also a worked example of what the
 * custom field accepts.
 */
export const PROGRESSION_PRESETS: Record<
  Exclude<ProgressionSource, "custom">,
  string
> = {
  "ii-V-I": "ii7 V7 Imaj7",
  blues12: "I7 I7 I7 I7 IV7 IV7 I7 I7 V7 IV7 I7 V7",
  pop: "I V vi IV",
};

export const MAX_CUSTOM_PROGRESSION_LENGTH = 160;

const ROOT_NAMES = ROOTS.map((r) => r.name);

export type ProgressionBlockConfig = ScoringConfig & {
  source: ProgressionSource;
  /**
   * Named `keyRoot`, not `key`: block config is spread onto the render
   * component as props, and React reserves `key`.
   */
  keyRoot: string;
  customText: string;
  /** Repeat the progression through a key cycle instead of one key. */
  cycleKeys: boolean;
  cycleOrder: KeyCycleOrder;
  keyCount: number;
};

export const progressionDefaultConfig: ProgressionBlockConfig = {
  source: "ii-V-I",
  keyRoot: "C",
  customText: PROGRESSION_PRESETS.pop,
  cycleKeys: false,
  cycleOrder: "fourths",
  keyCount: 12,
  requireExact: false,
  goodThreshold: 0,
  hardThreshold: 3,
};

export function normalizeProgressionBlockConfig(
  raw: unknown
): ProgressionBlockConfig {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  return {
    source: toEnum(r.source, PROGRESSION_SOURCES, progressionDefaultConfig.source),
    keyRoot: toEnum(r.keyRoot, ROOT_NAMES, progressionDefaultConfig.keyRoot),
    customText: toText(
      r.customText,
      progressionDefaultConfig.customText,
      MAX_CUSTOM_PROGRESSION_LENGTH
    ),
    cycleKeys: toBool(r.cycleKeys, progressionDefaultConfig.cycleKeys),
    cycleOrder: toEnum(
      r.cycleOrder,
      KEY_CYCLE_ORDERS,
      progressionDefaultConfig.cycleOrder
    ),
    keyCount: clamp(toInt(r.keyCount, progressionDefaultConfig.keyCount), 1, 12),
    ...normalizeScoring(r, progressionDefaultConfig),
  };
}

/** The roman-numeral text a config resolves to, preset or custom. */
export function progressionText(
  config: Pick<ProgressionBlockConfig, "source" | "customText">
): string {
  return config.source === "custom"
    ? config.customText
    : PROGRESSION_PRESETS[config.source];
}

export const progressionFields: FieldDescriptor[] = [
  {
    kind: "select",
    key: "source",
    label: "Progression",
    options: [
      { label: "ii–V–I", value: "ii-V-I" },
      { label: "12-bar blues", value: "blues12" },
      { label: "Pop loop (I–V–vi–IV)", value: "pop" },
      { label: "Custom", value: "custom" },
    ],
  },
  {
    kind: "select",
    key: "keyRoot",
    label: "Key",
    options: ROOT_NAMES.map((name) => ({ label: name, value: name })),
  },
  {
    kind: "text",
    key: "customText",
    label: "Custom roman numerals",
    placeholder: "I V vi IV",
  },
  {
    kind: "toggle",
    key: "cycleKeys",
    label: "Run through every key",
    helperText: "Repeat the progression around a key cycle",
  },
  {
    kind: "select",
    key: "cycleOrder",
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
