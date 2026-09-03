import type { FieldDescriptor } from "../types";
import { toEnum, toInt, toText, toBool } from "../coerce";
import { SCALE_IDS, SCALE_SPANS, SCALE_DIRECTIONS } from "../../scales";
import { ROOTS } from "../../music-theory";

export const SCALE_PATTERNS_WITH_CUSTOM = [
  "straight",
  "thirds",
  "triads",
  "custom",
] as const;
export type ScaleLibraryPattern = (typeof SCALE_PATTERNS_WITH_CUSTOM)[number];

export type ScaleLibraryConfig = {
  scale: string;
  root: string;
  span: (typeof SCALE_SPANS)[number];
  pattern: ScaleLibraryPattern;
  customCell: string;
  direction: (typeof SCALE_DIRECTIONS)[number];
  hands: "right" | "left" | "both";
  loopCount: number;
  metronomeAdvanced: boolean;
};

export const scaleLibraryDefaultConfig: ScaleLibraryConfig = {
  scale: "major",
  root: "C",
  span: "octave",
  pattern: "straight",
  customCell: "1235",
  direction: "upDown",
  hands: "right",
  loopCount: 1,
  metronomeAdvanced: false,
};

export function normalizeScaleLibraryConfig(raw: unknown): ScaleLibraryConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;
  const root =
    typeof r.root === "string" && ROOTS.some((cand) => cand.name === r.root)
      ? r.root
      : scaleLibraryDefaultConfig.root;
  const scale =
    typeof r.scale === "string" && SCALE_IDS.includes(r.scale)
      ? r.scale
      : scaleLibraryDefaultConfig.scale;

  return {
    scale,
    root,
    span: toEnum(r.span, SCALE_SPANS, "octave"),
    pattern: toEnum(r.pattern, SCALE_PATTERNS_WITH_CUSTOM, "straight"),
    customCell: toText(r.customCell, scaleLibraryDefaultConfig.customCell, 16),
    direction: toEnum(r.direction, SCALE_DIRECTIONS, "upDown"),
    hands: toEnum(r.hands, ["right", "left", "both"], "right"),
    loopCount: toInt(r.loopCount, scaleLibraryDefaultConfig.loopCount),
    metronomeAdvanced: toBool(r.metronomeAdvanced, false),
  };
}

const ROOT_NAMES = ROOTS.map((r) => r.name);

function scaleOptions() {
  return SCALE_IDS.map((id) => ({ label: id, value: id }));
}

export const scaleLibraryFields: FieldDescriptor[] = [
  {
    kind: "select",
    key: "scale",
    label: "Scale",
    options: scaleOptions(),
  },
  {
    kind: "select",
    key: "root",
    label: "Root",
    options: ROOT_NAMES.map((name) => ({ label: name, value: name })),
  },
  {
    kind: "select",
    key: "span",
    label: "Span",
    options: [
      { label: "5-finger", value: "pentascale" },
      { label: "1 octave", value: "octave" },
      { label: "2 octaves", value: "twoOctaves" },
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
      { label: "Custom cell", value: "custom" },
    ],
    helperText: "Custom cell repeats a degree pattern, Hanon style",
  },
  {
    kind: "text",
    key: "customCell",
    label: "Custom cell",
    placeholder: "1235 — degrees of the scale, 1 = root",
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
  {
    kind: "select",
    key: "hands",
    label: "Hands",
    options: [
      { label: "Right only", value: "right" },
      { label: "Left only", value: "left" },
      { label: "Both hands", value: "both" },
    ],
  },
  {
    kind: "range",
    key: "loopCount",
    label: "Repeats",
    min: 1,
    max: 12,
    step: 1,
  },
  {
    kind: "toggle",
    key: "metronomeAdvanced",
    label: "Advance on the beat",
    helperText: "One note per beat instead of event-advanced",
  },
];
