import type { FieldDescriptor } from "../types";

export type KeyboardDisplayConfig = {
  /** MIDI note number of the lowest key (always a C). */
  lowNote: number;
  octaves: number;
  showNoteNames: boolean;
  computerKeys: boolean;
};

const MIN_LOW_NOTE = 24; // C1
const MAX_LOW_NOTE = 72; // C5
const MAX_TOP_NOTE = 96; // C7 — keep the keyboard inside piano range

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

function toInt(n: unknown, fallback: number): number {
  const parsed = typeof n === "string" ? Number(n) : Number(n);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

function toBool(n: unknown, fallback: boolean): boolean {
  if (typeof n === "boolean") return n;
  if (n === "true" || n === 1 || n === "1") return true;
  if (n === "false" || n === 0 || n === "0") return false;
  return fallback;
}

export const keyboardDisplayDefaultConfig: KeyboardDisplayConfig = {
  lowNote: 48, // C3
  octaves: 2,
  showNoteNames: true,
  computerKeys: true,
};

export function keyboardLowNoteChoices(): number[] {
  return [24, 36, 48, 60, 72]; // C1–C5
}

function normalizeLowNote(raw: unknown): number {
  const parsed = toInt(raw, keyboardDisplayDefaultConfig.lowNote);
  const snapped = keyboardLowNoteChoices().reduce(
    (best, choice) =>
      Math.abs(choice - parsed) < Math.abs(best - parsed) ? choice : best,
    keyboardLowNoteChoices()[0]
  );
  return clamp(snapped, MIN_LOW_NOTE, MAX_LOW_NOTE);
}

function normalizeOctaves(raw: unknown, lowNote: number): number {
  const parsed = clamp(
    toInt(raw, keyboardDisplayDefaultConfig.octaves),
    1,
    4
  );
  // Keep the top note inside range: C3 + 4 octaves would pass C7.
  const maxOctaves = Math.floor((MAX_TOP_NOTE - lowNote) / 12) + 1;
  return Math.min(parsed, Math.max(maxOctaves, 1));
}

export function normalizeKeyboardDisplayConfig(
  raw: unknown
): KeyboardDisplayConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;

  const lowNote = normalizeLowNote(r.lowNote);

  return {
    lowNote,
    octaves: normalizeOctaves(r.octaves, lowNote),
    showNoteNames: toBool(
      r.showNoteNames,
      keyboardDisplayDefaultConfig.showNoteNames
    ),
    computerKeys: toBool(
      r.computerKeys,
      keyboardDisplayDefaultConfig.computerKeys
    ),
  };
}

export const keyboardDisplayFields: FieldDescriptor[] = [
  {
    kind: "select",
    key: "lowNote",
    label: "Lowest key",
    options: keyboardLowNoteChoices().map((note) => ({
      label: `C${note / 12 - 1}`,
      value: note,
    })),
    helperText: "First key on the left of the keyboard",
  },
  {
    kind: "range",
    key: "octaves",
    label: "Octaves",
    min: 1,
    max: 4,
    step: 1,
  },
  {
    kind: "toggle",
    key: "showNoteNames",
    label: "Show note names",
    helperText: "Letter names on the white keys",
  },
  {
    kind: "toggle",
    key: "computerKeys",
    label: "Computer keys",
    helperText: "Play with A W S E D F T G Y H U J K…",
  },
];
