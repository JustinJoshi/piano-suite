import type { FieldDescriptor } from "../types";
import { toEnum, toInt } from "../coerce";
import { SCALE_IDS } from "../../scales";
import { ROOTS } from "../../music-theory";

export type FreePlayConfig = {
  /** Scale that counts as "in" for the in-scale readout. */
  scale: string;
  root: string;
  /** Rolling window for density and placement, in seconds. */
  windowSeconds: number;
};

export const freePlayDefaultConfig: FreePlayConfig = {
  scale: "majorPentatonic",
  root: "C",
  windowSeconds: 30,
};

export function normalizeFreePlayConfig(raw: unknown): FreePlayConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;
  const scale =
    typeof r.scale === "string" && SCALE_IDS.includes(r.scale)
      ? r.scale
      : freePlayDefaultConfig.scale;
  const root =
    typeof r.root === "string" && ROOTS.some((cand) => cand.name === r.root)
      ? r.root
      : freePlayDefaultConfig.root;

  return {
    scale,
    root,
    windowSeconds: toInt(r.windowSeconds, freePlayDefaultConfig.windowSeconds),
  };
}

export const freePlayFields: FieldDescriptor[] = [
  {
    kind: "select",
    key: "scale",
    label: "Scale scope",
    options: SCALE_IDS.map((id) => ({ label: id, value: id })),
    helperText: "Notes in this scale count as in",
  },
  {
    kind: "select",
    key: "root",
    label: "Root",
    options: ROOTS.map((r) => ({ label: r.name, value: r.name })),
  },
  {
    kind: "range",
    key: "windowSeconds",
    label: "Window",
    min: 5,
    max: 120,
    step: 5,
    helperText: "Seconds of playing to analyze",
  },
];
