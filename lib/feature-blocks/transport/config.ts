import type { FieldDescriptor } from "../types";

export type TransportConfig = {
  bpm: number;
  beatsPerBar: number;
  countInBars: number;
  loopEnabled: boolean;
  loopStartBar: number;
  loopEndBar: number;
  rampEnabled: boolean;
  rampTargetBpm: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
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

export const transportDefaultConfig: TransportConfig = {
  bpm: 120,
  beatsPerBar: 4,
  countInBars: 1,
  loopEnabled: false,
  loopStartBar: 0,
  loopEndBar: 8,
  rampEnabled: false,
  rampTargetBpm: 140,
};

export function normalizeTransportConfig(raw: unknown): TransportConfig {
  const partial = typeof raw === "object" && raw !== null ? raw : {};
  const r = partial as Record<string, unknown>;

  return {
    bpm: clamp(
      toInt(r.bpm, transportDefaultConfig.bpm),
      30,
      300
    ),
    beatsPerBar: clamp(
      toInt(r.beatsPerBar, transportDefaultConfig.beatsPerBar),
      1,
      12
    ),
    countInBars: clamp(
      toInt(r.countInBars, transportDefaultConfig.countInBars),
      0,
      8
    ),
    loopEnabled: toBool(r.loopEnabled, transportDefaultConfig.loopEnabled),
    loopStartBar: clamp(
      toInt(r.loopStartBar, transportDefaultConfig.loopStartBar),
      0,
      128
    ),
    loopEndBar: clamp(
      toInt(r.loopEndBar, transportDefaultConfig.loopEndBar),
      0,
      128
    ),
    rampEnabled: toBool(r.rampEnabled, transportDefaultConfig.rampEnabled),
    rampTargetBpm: clamp(
      toInt(r.rampTargetBpm, transportDefaultConfig.rampTargetBpm),
      30,
      300
    ),
  };
}

export const transportFields: FieldDescriptor[] = [
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
    kind: "range",
    key: "countInBars",
    label: "Count-in bars",
    min: 0,
    max: 8,
    step: 1,
    helperText: "Bars of silence before practice starts",
  },
  {
    kind: "toggle",
    key: "loopEnabled",
    label: "Loop section",
    helperText: "Repeat the selected bar range",
  },
  {
    kind: "range",
    key: "loopStartBar",
    label: "Loop start",
    min: 0,
    max: 128,
    step: 1,
  },
  {
    kind: "range",
    key: "loopEndBar",
    label: "Loop end",
    min: 0,
    max: 128,
    step: 1,
  },
  {
    kind: "toggle",
    key: "rampEnabled",
    label: "Tempo ramp",
    helperText: "Gradually increase tempo during practice",
  },
  {
    kind: "range",
    key: "rampTargetBpm",
    label: "Target tempo",
    min: 30,
    max: 300,
    step: 1,
    helperText: "BPM to reach by the end of the ramp",
  },
];
