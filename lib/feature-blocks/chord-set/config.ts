import { ROOTS, QUALITY_GROUPS } from "@/lib/music-theory";
import type { FieldDescriptor } from "@/lib/feature-blocks/types";

export type ChordSetConfig = {
  roots: string[];
  qualityGroups: string[];
  order: "sequential" | "random";
  requireExact: boolean;
  goodThreshold: number;
  hardThreshold: number;
};

function toStringArray(n: unknown, fallback: string[]): string[] {
  if (Array.isArray(n)) {
    return n.filter((v): v is string => typeof v === "string");
  }
  return fallback;
}

function toBool(n: unknown, fallback: boolean): boolean {
  if (typeof n === "boolean") return n;
  if (n === "true" || n === 1 || n === "1") return true;
  if (n === "false" || n === 0 || n === "0") return false;
  return fallback;
}

function toInt(n: unknown, fallback: number): number {
  const parsed = typeof n === "string" ? Number(n) : Number(n);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

const DEFAULT_ROOTS = ["C", "F", "G"];
const DEFAULT_QUALITY_GROUPS = ["7th"];

export const chordSetDefaultConfig: ChordSetConfig = {
  roots: DEFAULT_ROOTS,
  qualityGroups: DEFAULT_QUALITY_GROUPS,
  order: "sequential",
  requireExact: false,
  goodThreshold: 0,
  hardThreshold: 2,
};

export function normalizeChordSetConfig(raw: unknown): ChordSetConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;

  const rawRoots = toStringArray(r.roots, chordSetDefaultConfig.roots);
  const validRoots = rawRoots.filter((name) =>
    ROOTS.some((root) => root.name === name)
  );

  const rawQualityGroups = toStringArray(
    r.qualityGroups,
    chordSetDefaultConfig.qualityGroups
  );
  const validQualityGroups = rawQualityGroups.filter((label) =>
    QUALITY_GROUPS.some((group) => group.label === label)
  );

  const rawOrder = r.order === "random" ? "random" : "sequential";

  return {
    roots: validRoots.length > 0 ? validRoots : DEFAULT_ROOTS,
    qualityGroups:
      validQualityGroups.length > 0 ? validQualityGroups : DEFAULT_QUALITY_GROUPS,
    order: rawOrder,
    requireExact: toBool(r.requireExact, chordSetDefaultConfig.requireExact),
    goodThreshold: clamp(
      toInt(r.goodThreshold, chordSetDefaultConfig.goodThreshold),
      0,
      99
    ),
    hardThreshold: clamp(
      toInt(r.hardThreshold, chordSetDefaultConfig.hardThreshold),
      0,
      99
    ),
  };
}

export const chordSetFields: FieldDescriptor[] = [
  {
    kind: "checkbox-group",
    key: "roots",
    label: "Roots",
    options: ROOTS.map((root) => ({ label: root.name, value: root.name })),
  },
  {
    kind: "checkbox-group",
    key: "qualityGroups",
    label: "Chord qualities",
    options: QUALITY_GROUPS.map((group) => ({
      label: group.label,
      value: group.label,
    })),
  },
  {
    kind: "select",
    key: "order",
    label: "Order",
    options: [
      { label: "Sequential", value: "sequential" },
      { label: "Random", value: "random" },
    ],
  },
  {
    kind: "toggle",
    key: "requireExact",
    label: "Require exact notes",
    helperText: "Extra notes count as wrong",
  },
  {
    kind: "range",
    key: "goodThreshold",
    label: "Good threshold",
    min: 0,
    max: 20,
    step: 1,
    helperText: "Max misses for a Good grade",
  },
  {
    kind: "range",
    key: "hardThreshold",
    label: "Hard threshold",
    min: 0,
    max: 20,
    step: 1,
    helperText: "Max misses for a Hard grade",
  },
];
