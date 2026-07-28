/**
 * Shared helpers for named lab pattern snapshots saved to Convex.
 */

export const LAB_PATTERN_TOOLS = ["chladni", "julia", "lissajous"] as const;
export type LabPatternTool = (typeof LAB_PATTERN_TOOLS)[number];

export function isLabPatternTool(value: string): value is LabPatternTool {
  return (LAB_PATTERN_TOOLS as readonly string[]).includes(value);
}

export function defaultPatternName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `Pattern ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asNumber(value: unknown, fallback: number): number {
  return isFiniteNumber(value) ? value : fallback;
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asPair(value: unknown, fallback: [number, number]): [number, number] {
  if (!Array.isArray(value) || value.length < 2) return [...fallback] as [number, number];
  const a = value[0];
  const b = value[1];
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) {
    return [...fallback] as [number, number];
  }
  return [a, b];
}

export type ChladniLabParams = {
  mode: [number, number];
  nextMode: [number, number];
  morph: number;
  autoMorph: boolean;
  morphSpeed: number;
  lineThickness: number;
  zoom: number;
  secondaryOffset: [number, number];
  secondaryBlend: number;
  secondarySpeed: number;
  secondaryMotion: number;
  breathe: number;
  timeScale: number;
};

export function normalizeChladniLabParams(
  raw: unknown,
  fallback: ChladniLabParams
): ChladniLabParams {
  const src =
    raw && typeof raw === "object" ? (raw as Partial<ChladniLabParams>) : {};
  return {
    mode: asPair(src.mode, fallback.mode),
    nextMode: asPair(src.nextMode, fallback.nextMode),
    morph: asNumber(src.morph, fallback.morph),
    autoMorph: asBool(src.autoMorph, fallback.autoMorph),
    morphSpeed: asNumber(src.morphSpeed, fallback.morphSpeed),
    lineThickness: asNumber(src.lineThickness, fallback.lineThickness),
    zoom: asNumber(src.zoom, fallback.zoom),
    secondaryOffset: asPair(src.secondaryOffset, fallback.secondaryOffset),
    secondaryBlend: asNumber(src.secondaryBlend, fallback.secondaryBlend),
    secondarySpeed: asNumber(src.secondarySpeed, fallback.secondarySpeed),
    secondaryMotion: asNumber(src.secondaryMotion, fallback.secondaryMotion),
    breathe: asNumber(src.breathe, fallback.breathe),
    timeScale: asNumber(src.timeScale, fallback.timeScale),
  };
}

export type JuliaLabParams = {
  c: [number, number];
  nextC: [number, number];
  morph: number;
  autoMorph: boolean;
  morphSpeed: number;
  zoom: number;
  maxIterations: number;
  escapeRadius: number;
  colorSoftness: number;
  timeScale: number;
};

export function normalizeJuliaLabParams(
  raw: unknown,
  fallback: JuliaLabParams
): JuliaLabParams {
  const src =
    raw && typeof raw === "object" ? (raw as Partial<JuliaLabParams>) : {};
  return {
    c: asPair(src.c, fallback.c),
    nextC: asPair(src.nextC, fallback.nextC),
    morph: asNumber(src.morph, fallback.morph),
    autoMorph: asBool(src.autoMorph, fallback.autoMorph),
    morphSpeed: asNumber(src.morphSpeed, fallback.morphSpeed),
    zoom: asNumber(src.zoom, fallback.zoom),
    maxIterations: asNumber(src.maxIterations, fallback.maxIterations),
    escapeRadius: asNumber(src.escapeRadius, fallback.escapeRadius),
    colorSoftness: asNumber(src.colorSoftness, fallback.colorSoftness),
    timeScale: asNumber(src.timeScale, fallback.timeScale),
  };
}

export type LissajousLabParamsSnapshot = {
  params: { a: number; b: number; delta: number };
  nextParams: { a: number; b: number; delta: number };
  morph: number;
  autoMorph: boolean;
  morphSpeed: number;
  sweepSpeed: number;
  trailFade: number;
  lineThickness: number;
  zoom: number;
  colorSoftness: number;
};

function asLissajousTriple(
  value: unknown,
  fallback: { a: number; b: number; delta: number }
): { a: number; b: number; delta: number } {
  if (!value || typeof value !== "object") return { ...fallback };
  const src = value as Partial<{ a: number; b: number; delta: number }>;
  return {
    a: asNumber(src.a, fallback.a),
    b: asNumber(src.b, fallback.b),
    delta: asNumber(src.delta, fallback.delta),
  };
}

export function normalizeLissajousLabParams(
  raw: unknown,
  fallback: LissajousLabParamsSnapshot
): LissajousLabParamsSnapshot {
  const src =
    raw && typeof raw === "object"
      ? (raw as Partial<LissajousLabParamsSnapshot>)
      : {};
  return {
    params: asLissajousTriple(src.params, fallback.params),
    nextParams: asLissajousTriple(src.nextParams, fallback.nextParams),
    morph: asNumber(src.morph, fallback.morph),
    autoMorph: asBool(src.autoMorph, fallback.autoMorph),
    morphSpeed: asNumber(src.morphSpeed, fallback.morphSpeed),
    sweepSpeed: asNumber(src.sweepSpeed, fallback.sweepSpeed),
    trailFade: asNumber(src.trailFade, fallback.trailFade),
    lineThickness: asNumber(src.lineThickness, fallback.lineThickness),
    zoom: asNumber(src.zoom, fallback.zoom),
    colorSoftness: asNumber(src.colorSoftness, fallback.colorSoftness),
  };
}
