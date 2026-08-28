import type { FieldDescriptor } from "../types";

export type MidiConnectionBarConfig = {
  compact: boolean;
};

export const midiConnectionBarDefaultConfig: MidiConnectionBarConfig = {
  compact: false,
};

export function normalizeMidiConnectionBarConfig(
  raw: unknown
): MidiConnectionBarConfig {
  if (typeof raw !== "object" || raw === null)
    return midiConnectionBarDefaultConfig;
  const r = raw as Record<string, unknown>;
  return {
    compact: typeof r.compact === "boolean" ? r.compact : false,
  };
}

export const midiConnectionBarFields: FieldDescriptor[] = [
  {
    kind: "toggle",
    key: "compact",
    label: "Compact mode",
    helperText: "Show a minimal connection indicator instead of the full bar.",
  },
];
