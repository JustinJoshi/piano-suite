import type { FieldDescriptor } from "../types";
import { toEnum, toBool } from "../coerce";

export type TargetDisplayConfig = {
  view: "symbols" | "keysDiagram";
  showNext: boolean;
  showPosition: boolean;
};

export const targetDisplayDefaultConfig: TargetDisplayConfig = {
  view: "symbols",
  showNext: true,
  showPosition: true,
};

export function normalizeTargetDisplayConfig(raw: unknown): TargetDisplayConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;

  return {
    view: toEnum(r.view, ["symbols", "keysDiagram"], "symbols"),
    showNext: toBool(r.showNext, targetDisplayDefaultConfig.showNext),
    showPosition: toBool(r.showPosition, targetDisplayDefaultConfig.showPosition),
  };
}

export const targetDisplayFields: FieldDescriptor[] = [
  {
    kind: "select",
    key: "view",
    label: "Display style",
    options: [
      { label: "Chord symbols", value: "symbols" },
      { label: "Keys diagram", value: "keysDiagram" },
    ],
    helperText: "How to show the current target",
  },
  {
    kind: "toggle",
    key: "showNext",
    label: "Show next",
    helperText: "Preview the upcoming target",
  },
  {
    kind: "toggle",
    key: "showPosition",
    label: "Show position",
    helperText: "Display progress (e.g. 3 of 8)",
  },
];
