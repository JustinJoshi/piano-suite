import { clamp, toInt } from "../coerce";
import type { FieldDescriptor } from "../types";

export type SectionLoopConfig = {
  startBar: number;
  endBar: number;
  repeats: number;
};

export const sectionLoopDefaultConfig: SectionLoopConfig = {
  startBar: 0,
  endBar: 4,
  repeats: 1,
};

export function normalizeSectionLoopConfig(raw: unknown): SectionLoopConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;

  const startBar = clamp(
    toInt(r.startBar, sectionLoopDefaultConfig.startBar),
    0,
    999
  );
  const endBar = clamp(
    toInt(r.endBar, sectionLoopDefaultConfig.endBar),
    startBar + 1,
    startBar + 1000
  );
  const repeats = clamp(toInt(r.repeats, sectionLoopDefaultConfig.repeats), 1, 16);

  return { startBar, endBar, repeats };
}

export const sectionLoopFields: FieldDescriptor[] = [
  {
    kind: "range",
    key: "startBar",
    label: "First bar",
    min: 0,
    max: 999,
    step: 1,
    helperText: "Section starts at this bar (0-indexed)",
  },
  {
    kind: "range",
    key: "endBar",
    label: "Last bar",
    min: 1,
    max: 1000,
    step: 1,
    helperText: "Exclusive: notes before this bar are kept",
  },
  {
    kind: "range",
    key: "repeats",
    label: "Repeats",
    min: 1,
    max: 16,
    step: 1,
    helperText: "How many times the section loops",
  },
];
