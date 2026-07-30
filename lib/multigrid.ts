/**
 * Pure de Bruijn multigrid → dual rhombus tiling math.
 *
 * Inspired by Pattern Collider (Aatish Bhatia / Minute Physics, MIT):
 * N families of parallel lines dualize to filled polygons that tile the plane.
 *
 * This module is independent of the soft-wave Quasiperiodic Lab.
 */

import { clamp, lerp } from "@/lib/chladni";

export const MIN_SYMMETRY = 3;
export const MAX_SYMMETRY = 16;

export type MultigridRecipe = {
  symmetry: number;
  pattern: number;
  rotate: number;
  pan: number;
  disorder: number;
  randomSeed: number;
  zoom: number;
  radius: number;
};

/** `"tiling"` / `"both"` marked for deletion — coerced to grid in settings/viz. */
export type MultigridViewMode = "both" | "tiling" | "grid";

export type GridLine = {
  angle: number;
  index: number;
};

export type Point2 = { x: number; y: number };

export type DualTile = {
  x: number;
  y: number;
  dualPts: Point2[];
  mean: Point2;
  area: number;
  angles: string;
  numVertices: number;
  lines: GridLine[];
};

export type MultigridScene = {
  lines: GridLine[];
  tiles: DualTile[];
  offsets: number[];
  multiplier: number;
  steps: number;
};

export const DEFAULT_RECIPE: MultigridRecipe = {
  symmetry: 5,
  pattern: 0.2,
  rotate: 0,
  pan: 0,
  disorder: 0,
  randomSeed: 0,
  zoom: 1,
  radius: 75,
};

export const MULTIGRID_PRESETS: { label: string; recipe: Partial<MultigridRecipe> }[] = [
  { label: "Penrose", recipe: { symmetry: 5, pattern: 0.2, disorder: 0, rotate: 0, pan: 0 } },
  { label: "Ammann", recipe: { symmetry: 8, pattern: 0.5, disorder: 0, rotate: 0, pan: 0 } },
  { label: "Socolar", recipe: { symmetry: 12, pattern: 0, disorder: 0, rotate: 15, pan: 0.02 } },
  { label: "Dense", recipe: { symmetry: 13, pattern: 0.39, disorder: 0.33, rotate: -121.8, pan: 0.549, randomSeed: 0.01 } },
];

const EPSILON = 1e-6;
const INVERSE_EPSILON = 1e6;

/** Mulberry32 seeded PRNG — deterministic, no deps. */
export function createSeededRandom(seed: number): () => number {
  let t = (Math.floor(seed * 0xffffffff) >>> 0) || 1;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function clampSymmetry(n: number): number {
  return Math.round(clamp(n, MIN_SYMMETRY, MAX_SYMMETRY));
}

export function normalizeRecipe(
  recipe: Partial<MultigridRecipe> | null | undefined
): MultigridRecipe {
  const d = DEFAULT_RECIPE;
  const src = recipe ?? {};
  return {
    symmetry: clampSymmetry(
      typeof src.symmetry === "number" && Number.isFinite(src.symmetry)
        ? src.symmetry
        : d.symmetry
    ),
    pattern: clamp(
      typeof src.pattern === "number" && Number.isFinite(src.pattern)
        ? src.pattern
        : d.pattern,
      0,
      1
    ),
    rotate: clamp(
      typeof src.rotate === "number" && Number.isFinite(src.rotate)
        ? src.rotate
        : d.rotate,
      -180,
      180
    ),
    pan: clamp(
      typeof src.pan === "number" && Number.isFinite(src.pan) ? src.pan : d.pan,
      0,
      1
    ),
    disorder: clamp(
      typeof src.disorder === "number" && Number.isFinite(src.disorder)
        ? src.disorder
        : d.disorder,
      0,
      1
    ),
    randomSeed: clamp(
      typeof src.randomSeed === "number" && Number.isFinite(src.randomSeed)
        ? src.randomSeed
        : d.randomSeed,
      0,
      1
    ),
    zoom: clamp(
      typeof src.zoom === "number" && Number.isFinite(src.zoom) ? src.zoom : d.zoom,
      0.3,
      4
    ),
    radius: clamp(
      typeof src.radius === "number" && Number.isFinite(src.radius)
        ? src.radius
        : d.radius,
      20,
      200
    ),
  };
}

export function randomRecipe(): MultigridRecipe {
  return normalizeRecipe({
    symmetry: Math.floor(Math.random() * (MAX_SYMMETRY - MIN_SYMMETRY + 1)) + MIN_SYMMETRY,
    pattern: Math.random(),
    rotate: (Math.random() - 0.5) * 360,
    pan: Math.random() * 0.6,
    disorder: Math.random() * 0.5,
    randomSeed: Math.random(),
    zoom: 0.8 + Math.random() * 0.8,
    radius: 50 + Math.random() * 60,
  });
}

function approx(x: number): number {
  return Math.round(x * INVERSE_EPSILON) / INVERSE_EPSILON;
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function stepsFromRadius(radius: number, symmetry: number): number {
  return 2 * Math.round((radius / (symmetry - 1) - 1) / 2) + 1;
}

function make1DGrid(steps: number): number[] {
  const half = (steps - 1) / 2;
  const arr = Array.from({ length: steps }, (_, i) => i - half);
  return arr.sort((a, b) => Math.abs(a) - Math.abs(b));
}

function sinCosTable(symmetry: number, multiplier: number) {
  return Array.from({ length: symmetry }, (_, i) => ({
    sin: Math.sin(i * multiplier),
    cos: Math.cos(i * multiplier),
  }));
}

export function computeOffsets(recipe: MultigridRecipe): number[] {
  const r = normalizeRecipe(recipe);
  const multiplier = (2 * Math.PI) / r.symmetry;
  const table = sinCosTable(r.symmetry, multiplier);
  const rotateRad = (r.rotate * Math.PI) / 180;
  const cosR = Math.cos(rotateRad);
  const sinR = Math.sin(rotateRad);
  const shift = table.map((e) => e.cos * cosR - e.sin * sinR);
  const steps = stepsFromRadius(r.radius, r.symmetry);

  let offsets = Array(r.symmetry).fill(r.pattern) as number[];

  if (r.disorder > 0) {
    const random = createSeededRandom(r.symmetry * 1000 + r.randomSeed * 1e6);
    offsets = offsets.map((e) => e + r.disorder * (random() - 0.5));
  }

  if (r.pan > 0) {
    offsets = offsets.map((e, i) => e - steps * r.pan * (shift[i] ?? 0));
  }

  return offsets;
}

export function buildGridLines(recipe: MultigridRecipe): GridLine[] {
  const r = normalizeRecipe(recipe);
  const offsets = computeOffsets(r);
  const steps = stepsFromRadius(r.radius, r.symmetry);
  const indices = make1DGrid(steps);
  const lines: GridLine[] = [];

  for (let i = 0; i < r.symmetry; i++) {
    const off = offsets[i] ?? 0;
    for (const n of indices) {
      lines.push({
        angle: i,
        index: n + (off % 1),
      });
    }
  }

  return lines;
}

/**
 * Build the full multigrid scene: lines + dual tiles, culled to a logical radius.
 * `viewWidth` / `viewHeight` are optional pixel sizes for extra viewport cull
 * (when omitted, only distance cull is used — good for unit tests).
 */
export function buildMultigridScene(
  recipe: MultigridRecipe,
  viewWidth = 800,
  viewHeight = 600
): MultigridScene {
  const r = normalizeRecipe(recipe);
  const multiplier = (2 * Math.PI) / r.symmetry;
  const offsets = computeOffsets(r);
  const steps = stepsFromRadius(r.radius, r.symmetry);
  const table = sinCosTable(r.symmetry, multiplier);
  const lines = buildGridLines(r);
  const spacing =
    (r.zoom * Math.min(viewWidth, viewHeight)) / Math.max(steps, 1);
  const rotateRad = (r.rotate * Math.PI) / 180;
  const cosR = Math.cos(rotateRad);
  const sinR = Math.sin(rotateRad);

  type PtAccum = {
    x: number;
    y: number;
    lines: GridLine[];
  };

  const pts: Record<string, PtAccum> = {};

  for (const line1 of lines) {
    for (const line2 of lines) {
      if (line1.angle >= line2.angle) continue;

      const sc1 = table[line1.angle];
      const sc2 = table[line2.angle];
      if (!sc1 || !sc2) continue;

      const s1 = sc1.sin;
      const c1 = sc1.cos;
      const s2 = sc2.sin;
      const c2 = sc2.cos;
      const s12 = s1 * c2 - c1 * s2;
      if (Math.abs(s12) <= EPSILON) continue;

      const s21 = -s12;
      const x = (line2.index * s1 - line1.index * s2) / s12;
      const y = (line2.index * c1 - line1.index * c2) / s21;

      const xprime = x * cosR - y * sinR;
      const yprime = x * sinR + y * cosR;

      if (
        Math.abs(xprime * spacing) > viewWidth / 2 + spacing ||
        Math.abs(yprime * spacing) > viewHeight / 2 + spacing
      ) {
        continue;
      }

      const d0 = dist(x, y, 0, 0);
      if (steps === 1) {
        if (d0 > 0.5 * steps) continue;
      } else if (d0 > 0.5 * (steps - 1)) {
        continue;
      }

      const key = JSON.stringify([approx(x), approx(y)]);
      const existing = pts[key];
      if (existing) {
        if (!existing.lines.some((l) => l.angle === line1.angle && l.index === line1.index)) {
          existing.lines.push(line1);
        }
        if (!existing.lines.some((l) => l.angle === line2.angle && l.index === line2.index)) {
          existing.lines.push(line2);
        }
      } else {
        pts[key] = { x, y, lines: [line1, line2] };
      }
    }
  }

  const tiles: DualTile[] = [];

  for (const pt of Object.values(pts)) {
    let angles = pt.lines.map((e) => e.angle * multiplier);
    const angles2 = angles.map((e) => (e + Math.PI) % (2 * Math.PI));
    angles = [...angles, ...angles2]
      .map((e) => approx(e))
      .sort((a, b) => a - b)
      .filter((e, i, arr) => arr.indexOf(e) === i);

    const offsetPts: Point2[] = [];
    for (const angle of angles) {
      offsetPts.push({
        x: pt.x + EPSILON * -Math.sin(angle),
        y: pt.y + EPSILON * Math.cos(angle),
      });
    }

    const medianPts: Point2[] = [];
    const iMax = offsetPts.length;
    for (let i = 0; i < iMax; i++) {
      const a = offsetPts[i]!;
      const b = offsetPts[(i + 1) % iMax]!;
      medianPts.push({
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
      });
    }

    const dualPts: Point2[] = [];
    const mean = { x: 0, y: 0 };

    for (const myPt of medianPts) {
      let xd = 0;
      let yd = 0;
      for (let i = 0; i < r.symmetry; i++) {
        const ci = table[i]!.cos;
        const si = table[i]!.sin;
        const k = Math.floor(myPt.x * ci + myPt.y * si - (offsets[i] ?? 0));
        xd += k * ci;
        yd += k * si;
      }
      dualPts.push({ x: xd, y: yd });
      mean.x += xd;
      mean.y += yd;
    }

    const dMax = dualPts.length;
    if (dMax < 3) continue;
    mean.x /= dMax;
    mean.y /= dMax;

    let area = 0;
    for (let i = 0; i < dMax; i++) {
      const a = dualPts[i]!;
      const b = dualPts[(i + 1) % dMax]!;
      area += 0.5 * (a.x * b.y - a.y * b.x);
    }

    tiles.push({
      x: pt.x,
      y: pt.y,
      dualPts,
      mean,
      area: Math.round(1000 * area) / 1000,
      angles: JSON.stringify(angles),
      numVertices: angles.length,
      lines: pt.lines,
    });
  }

  return { lines, tiles, offsets, multiplier, steps };
}

/** Blend continuous fields; snap symmetry/seed at endpoints. */
export function blendRecipes(
  a: MultigridRecipe,
  b: MultigridRecipe,
  t: number
): MultigridRecipe {
  const k = clamp(t, 0, 1);
  const na = normalizeRecipe(a);
  const nb = normalizeRecipe(b);
  return normalizeRecipe({
    symmetry: k < 0.5 ? na.symmetry : nb.symmetry,
    pattern: lerp(na.pattern, nb.pattern, k),
    rotate: lerp(na.rotate, nb.rotate, k),
    pan: lerp(na.pan, nb.pan, k),
    disorder: lerp(na.disorder, nb.disorder, k),
    randomSeed: k < 0.5 ? na.randomSeed : nb.randomSeed,
    zoom: lerp(na.zoom, nb.zoom, k),
    radius: lerp(na.radius, nb.radius, k),
  });
}

/** Unique orientation keys for palette indexing. */
export function uniqueOrientationKeys(tiles: DualTile[]): string[] {
  const keys = new Set<string>();
  for (const tile of tiles) {
    keys.add(tile.angles);
  }
  return [...keys].sort();
}
