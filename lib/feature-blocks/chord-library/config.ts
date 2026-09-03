import type { FieldDescriptor } from "../types";
import { toEnum, toBool, toInt, toText } from "../coerce";
import { ROOTS } from "../../music-theory";

export type ChordVoicing = "closed" | "rootlessA" | "rootlessB";

export type ChordLibraryConfig = {
  mode: "set" | "romanNumerals";
  chords: string;
  numerals: string;
  keyRoot: string;
  voicing: ChordVoicing;
  showNext: boolean;
  loopCount: number;
};

export const chordLibraryDefaultConfig: ChordLibraryConfig = {
  mode: "set",
  chords: "Cmaj7, Dm7, G7",
  numerals: "ii7 V7 Imaj7",
  keyRoot: "C",
  voicing: "closed",
  showNext: true,
  loopCount: 1,
};

const VOICINGS: ChordVoicing[] = ["closed", "rootlessA", "rootlessB"];

export function normalizeChordLibraryConfig(raw: unknown): ChordLibraryConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;
  const keyRoot =
    typeof r.keyRoot === "string" && ROOTS.some((root) => root.name === r.keyRoot)
      ? r.keyRoot
      : chordLibraryDefaultConfig.keyRoot;

  return {
    mode: toEnum(r.mode, ["set", "romanNumerals"], "set"),
    chords: toText(r.chords, chordLibraryDefaultConfig.chords),
    numerals: toText(r.numerals, chordLibraryDefaultConfig.numerals),
    keyRoot,
    voicing: toEnum(r.voicing, VOICINGS, "closed"),
    showNext: toBool(r.showNext, chordLibraryDefaultConfig.showNext),
    loopCount: toInt(r.loopCount, chordLibraryDefaultConfig.loopCount),
  };
}

const ROOT_NAMES = ROOTS.map((root) => root.name);

export const chordLibraryFields: FieldDescriptor[] = [
  {
    kind: "select",
    key: "mode",
    label: "Chord source",
    options: [
      { label: "Chord symbols", value: "set" },
      { label: "Roman numerals", value: "romanNumerals" },
    ],
    helperText: "Pick chords by name, or build a progression in a key",
  },
  {
    kind: "text",
    key: "chords",
    label: "Chords",
    placeholder: "Cmaj7, Dm7, G7",
  },
  {
    kind: "text",
    key: "numerals",
    label: "Progression",
    placeholder: "ii7 V7 Imaj7",
  },
  {
    kind: "select",
    key: "keyRoot",
    label: "Key",
    options: ROOT_NAMES.map((name) => ({ label: name, value: name })),
  },
  {
    kind: "select",
    key: "voicing",
    label: "Voicing",
    options: [
      { label: "Closed position", value: "closed" },
      { label: "Rootless A (3-5-7-9)", value: "rootlessA" },
      { label: "Rootless B (7-9-3-5)", value: "rootlessB" },
    ],
    helperText: "Rootless applies to 7th chords; triads stay closed",
  },
  {
    kind: "toggle",
    key: "showNext",
    label: "Preview next chord",
  },
  {
    kind: "range",
    key: "loopCount",
    label: "Repeats",
    min: 1,
    max: 12,
    step: 1,
  },
];
