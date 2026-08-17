import type { FieldDescriptor } from "@/lib/feature-blocks/types";

export type MetronomeConfig = {
  bpm: number;
  beatsPerBar: number;
  accentFirstBeat: boolean;
  minBpm: number;
  maxBpm: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function toInt(n: unknown, fallback: number): number {
  const parsed = typeof n === "string" ? Number(n) : Number(n);
  return Number.isFinite(parsed) ? Math.floor(parsed) : fallback;
}

function toNumber(n: unknown, fallback: number): number {
  const parsed = typeof n === "string" ? Number(n) : Number(n);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBool(n: unknown, fallback: boolean): boolean {
  if (typeof n === "boolean") return n;
  if (n === "true" || n === 1 || n === "1") return true;
  if (n === "false" || n === 0 || n === "0") return false;
  return fallback;
}

export const metronomeDefaultConfig: MetronomeConfig = {
  bpm: 120,
  beatsPerBar: 4,
  accentFirstBeat: true,
  minBpm: 40,
  maxBpm: 220,
};

export function normalizeMetronomeConfig(raw: unknown): MetronomeConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;

  const minBpm = clamp(toNumber(r.minBpm, metronomeDefaultConfig.minBpm), 20, 300);
  const maxBpm = clamp(toNumber(r.maxBpm, metronomeDefaultConfig.maxBpm), 20, 300);
  const safeMin = Math.min(minBpm, maxBpm);
  const safeMax = Math.max(minBpm, maxBpm);

  return {
    bpm: clamp(
      toNumber(r.bpm, metronomeDefaultConfig.bpm),
      safeMin,
      safeMax
    ),
    beatsPerBar: clamp(
      toInt(r.beatsPerBar, metronomeDefaultConfig.beatsPerBar),
      1,
      12
    ),
    accentFirstBeat: toBool(
      r.accentFirstBeat,
      metronomeDefaultConfig.accentFirstBeat
    ),
    minBpm: safeMin,
    maxBpm: safeMax,
  };
}

export const metronomeFields: FieldDescriptor[] = [
  {
    kind: "range",
    key: "bpm",
    label: "Tempo",
    min: 30,
    max: 300,
    step: 1,
    helperText: "Beats per minute",
  },
  {
    kind: "select",
    key: "beatsPerBar",
    label: "Beats per bar",
    options: [
      { label: "2", value: 2 },
      { label: "3", value: 3 },
      { label: "4", value: 4 },
      { label: "5", value: 5 },
      { label: "6", value: 6 },
      { label: "7", value: 7 },
      { label: "8", value: 8 },
      { label: "9", value: 9 },
      { label: "12", value: 12 },
    ],
  },
  {
    kind: "toggle",
    key: "accentFirstBeat",
    label: "Accent first beat",
  },
];


