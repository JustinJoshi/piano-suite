/**
 * Pure Chladni → SVG brand-mark geometry.
 *
 * Samples the square-plate Chladni function on a grid, keeps cells near the
 * nodal lines, optionally keeps only the band outline, then merges horizontal
 * runs into compact SVG rect subpaths.
 */

import { chladni, clamp } from "@/lib/chladni";
import {
  DEFAULT_LOGO_MARK_SETTINGS,
  type LogoMarkSettings,
} from "@/lib/logo-mark-settings";

export const LOGO_MARK_VIEWBOX = 100;
/** Default sample resolution — dense enough for 128px, light enough for inline SVG. */
export const LOGO_MARK_RESOLUTION = 40;

/** Baked colors for static favicon / data-URL export (amber theme defaults). */
export const LOGO_MARK_BAKED_PATTERN = "#c9a227";
export const LOGO_MARK_BAKED_PLATE = "#0c0a08";

export type LogoMarkRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LogoMarkGeometry = {
  plate: { x: number; y: number; size: number; rx: number } | null;
  rects: LogoMarkRect[];
  pathD: string;
};

function sampleGrid(
  settings: LogoMarkSettings,
  resolution: number
): boolean[][] {
  const [m, n] = settings.mode;
  const zoom = Math.max(settings.zoom, 0.01);
  const half = 1 / zoom;
  const band = settings.threshold * (0.65 + settings.lineThickness * 0.12);

  const grid: boolean[][] = Array.from({ length: resolution }, () =>
    Array.from({ length: resolution }, () => false)
  );

  for (let j = 0; j < resolution; j++) {
    const row = grid[j]!;
    const v = ((j + 0.5) / resolution) * 2 - 1;
    const y = v * half;
    for (let i = 0; i < resolution; i++) {
      const u = ((i + 0.5) / resolution) * 2 - 1;
      const x = u * half;
      row[i] = Math.abs(chladni(x, y, m, n)) <= band;
    }
  }

  return grid;
}

function outlineOnly(grid: boolean[][]): boolean[][] {
  const h = grid.length;
  const w = grid[0]?.length ?? 0;
  const out: boolean[][] = Array.from({ length: h }, () =>
    Array.from({ length: w }, () => false)
  );

  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      if (!grid[j]![i]) continue;
      let edge = i === 0 || j === 0 || i === w - 1 || j === h - 1;
      if (!edge) {
        edge =
          !grid[j]![i - 1] ||
          !grid[j]![i + 1] ||
          !grid[j - 1]![i] ||
          !grid[j + 1]![i];
      }
      out[j]![i] = edge;
    }
  }
  return out;
}

/**
 * Merge contiguous true cells in each row into axis-aligned rects in viewBox space.
 */
export function gridToRects(
  grid: boolean[][],
  padding: number,
  viewBox = LOGO_MARK_VIEWBOX
): LogoMarkRect[] {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return [];

  const inner = viewBox - padding * 2;
  const cellW = inner / cols;
  const cellH = inner / rows;
  const rects: LogoMarkRect[] = [];

  for (let j = 0; j < rows; j++) {
    const row = grid[j]!;
    let i = 0;
    while (i < cols) {
      while (i < cols && !row[i]) i++;
      if (i >= cols) break;
      const start = i;
      while (i < cols && row[i]) i++;
      const count = i - start;
      rects.push({
        x: padding + start * cellW,
        y: padding + j * cellH,
        w: count * cellW,
        h: cellH,
      });
    }
  }

  return rects;
}

export function rectsToPathD(rects: LogoMarkRect[]): string {
  if (rects.length === 0) return "";
  return rects
    .map((r) => {
      const x2 = r.x + r.w;
      const y2 = r.y + r.h;
      return `M${fmt(r.x)} ${fmt(r.y)}H${fmt(x2)}V${fmt(y2)}H${fmt(r.x)}Z`;
    })
    .join("");
}

function fmt(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function buildLogoMarkGeometry(
  settings: LogoMarkSettings,
  resolution = LOGO_MARK_RESOLUTION
): LogoMarkGeometry {
  const normalized = {
    ...DEFAULT_LOGO_MARK_SETTINGS,
    ...settings,
  };
  let grid = sampleGrid(normalized, resolution);
  if (normalized.strokeOnly) {
    grid = outlineOnly(grid);
  }
  const rects = gridToRects(grid, normalized.padding);
  const plate = normalized.showPlate
    ? {
        x: 0,
        y: 0,
        size: LOGO_MARK_VIEWBOX,
        rx: clamp(normalized.cornerRadius, 0, 40),
      }
    : null;

  return {
    plate,
    rects,
    pathD: rectsToPathD(rects),
  };
}

export type LogoMarkSvgOptions = {
  /** When true, bake amber defaults instead of currentColor / CSS vars. */
  baked?: boolean;
  /** Include XML namespace (for standalone files / data URLs). */
  standalone?: boolean;
  resolution?: number;
  className?: string;
  /** Override pattern fill (takes precedence over baked/theme). */
  patternFill?: string;
  plateFill?: string;
};

/**
 * Build a complete SVG document/snippet for the logo mark.
 */
export function settingsToSvgString(
  settings: LogoMarkSettings,
  options: LogoMarkSvgOptions = {}
): string {
  const {
    baked = false,
    standalone = false,
    resolution = LOGO_MARK_RESOLUTION,
    className,
    patternFill,
    plateFill,
  } = options;

  const geometry = buildLogoMarkGeometry(settings, resolution);
  const pattern =
    patternFill ??
    settings.patternColor ??
    (baked ? LOGO_MARK_BAKED_PATTERN : "currentColor");
  const plate =
    plateFill ??
    settings.plateColor ??
    (baked ? LOGO_MARK_BAKED_PLATE : "var(--color-background)");

  const ns = standalone ? ` xmlns="http://www.w3.org/2000/svg"` : "";
  const cls = className ? ` class="${className}"` : "";
  const plateEl = geometry.plate
    ? `<rect width="${geometry.plate.size}" height="${geometry.plate.size}" rx="${fmt(geometry.plate.rx)}" fill="${plate}"/>`
    : "";
  const pathEl = geometry.pathD
    ? `<path fill="${pattern}" d="${geometry.pathD}"/>`
    : "";

  return `<svg${ns}${cls} viewBox="0 0 ${LOGO_MARK_VIEWBOX} ${LOGO_MARK_VIEWBOX}" width="${LOGO_MARK_VIEWBOX}" height="${LOGO_MARK_VIEWBOX}" aria-hidden="true">${plateEl}${pathEl}</svg>`;
}

export function settingsToDataUrl(
  settings: LogoMarkSettings,
  options: Omit<LogoMarkSvgOptions, "standalone"> = {}
): string {
  const svg = settingsToSvgString(settings, {
    ...options,
    baked: options.baked ?? true,
    standalone: true,
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Deterministic shipping favicon SVG (baked amber). */
export function defaultLogoMarkSvg(): string {
  return settingsToSvgString(DEFAULT_LOGO_MARK_SETTINGS, {
    baked: true,
    standalone: true,
  });
}
