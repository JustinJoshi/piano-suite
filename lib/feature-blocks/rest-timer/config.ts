import { clamp, toBool, toInt, toText } from "../coerce";
import type { FieldDescriptor } from "../types";

export type RestTimerConfig = {
  seconds: number;
  label: string;
  chime: boolean;
};

export const MAX_REST_LABEL_LENGTH = 40;

export const restTimerDefaultConfig: RestTimerConfig = {
  seconds: 60,
  label: "Rest",
  chime: true,
};

export function normalizeRestTimerConfig(raw: unknown): RestTimerConfig {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  return {
    seconds: clamp(toInt(r.seconds, restTimerDefaultConfig.seconds), 5, 1800),
    label: toText(r.label, restTimerDefaultConfig.label, MAX_REST_LABEL_LENGTH),
    chime: toBool(r.chime, restTimerDefaultConfig.chime),
  };
}

export const restTimerFields: FieldDescriptor[] = [
  {
    kind: "range",
    key: "seconds",
    label: "Length",
    min: 5,
    max: 600,
    step: 5,
    helperText: "Seconds of rest between sets",
  },
  { kind: "text", key: "label", label: "Label", placeholder: "Rest" },
  { kind: "toggle", key: "chime", label: "Chime when the rest ends" },
];
