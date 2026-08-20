import type { FieldDescriptor } from "../types";

export type TextBlockConfig = {
  text: string;
};

export const textBlockDefaultConfig: TextBlockConfig = {
  text: "Enter your practice instructions here…",
};

export function normalizeTextBlockConfig(raw: unknown): TextBlockConfig {
  if (typeof raw !== "object" || raw === null) return textBlockDefaultConfig;
  const r = raw as Record<string, unknown>;
  const text =
    typeof r.text === "string"
      ? r.text.trim().slice(0, 2000)
      : textBlockDefaultConfig.text;
  return { text: text || textBlockDefaultConfig.text };
}

export const textBlockFields: FieldDescriptor[] = [
  {
    kind: "text" as const,
    key: "text",
    label: "Instructions",
    placeholder: "Enter your practice instructions here…",
  },
];
