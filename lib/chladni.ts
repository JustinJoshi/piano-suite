/**
 * Pure Chladni figure math.
 *
 * Chladni figures visualize the nodal lines of a vibrating plate: the places
 * where the displacement is zero. Sand or other fine particles settle along
 * these zero-amplitude lines, producing the characteristic geometric patterns.
 *
 * For a square plate the nodal lines can be approximated by:
 *   cos(n * pi * x) * cos(m * pi * y) - cos(m * pi * x) * cos(n * pi * y) = 0
 */

/**
 * Evaluate the square-plate Chladni function at (x, y) for mode (m, n).
 * Returns 0 exactly on the nodal lines.
 */
export function chladni(x: number, y: number, m: number, n: number): number {
  const a = Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y);
  const b = Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
  return a - b;
}

/**
 * Blend two Chladni modes. `blend` is 0..1 where 0 returns the first mode
 * and 1 returns the second.
 */
export function chladniComplex(
  x: number,
  y: number,
  m: number,
  n: number,
  m2: number,
  n2: number,
  blend: number
): number {
  return chladni(x, y, m, n) * (1 - blend) + chladni(x, y, m2, n2) * blend;
}

/**
 * Curated (m, n) pairs that produce attractive, non-trivial Chladni figures.
 * The sequence is filtered by `maxMode` and shuffled so consecutive patterns
 * differ noticeably.
 */
const MODE_PAIRS: [number, number][] = [
  [4, 5], [5, 6], [6, 7], [7, 8],
  [5, 7], [7, 5], [6, 8], [8, 6],
  [4, 7], [7, 4], [5, 8], [8, 5],
  [6, 9], [9, 6], [7, 9], [9, 7],
  [5, 9], [9, 5], [8, 9], [9, 8],
  [4, 6], [6, 4], [7, 10], [10, 7],
  [5, 10], [10, 5], [6, 10], [10, 6],
  [8, 10], [10, 8], [9, 10], [10, 9],
  [4, 8], [8, 4], [5, 11], [11, 5],
  [6, 11], [11, 6], [7, 11], [11, 7],
  [8, 11], [11, 8], [9, 11], [11, 9],
  [10, 11], [11, 10],
];

/**
 * Build a randomized sequence of Chladni modes with both components <= maxMode.
 * The result excludes trivial n === m cases.
 */
export function buildModeSequence(maxMode: number): [number, number][] {
  const seq = MODE_PAIRS.filter((p) => p[0] <= maxMode && p[1] <= maxMode);
  for (let i = seq.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [seq[i], seq[j]] = [seq[j], seq[i]];
  }
  return seq;
}

/** Smooth Hermite interpolation from 0 to 1. */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Linear interpolation from a to b. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp a value between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate a random Chladni mode pair (m, n) with both components in
 * [2, max] and m !== n. Useful for auto-cycling and randomize buttons.
 * If max is too small for a non-trivial pair, returns [2, 3].
 */
export function randomMode(max = 12): [number, number] {
  const cap = Math.max(3, Math.floor(max));
  const m = Math.floor(Math.random() * (cap - 1)) + 2;
  let n = Math.floor(Math.random() * (cap - 1)) + 2;
  while (n === m) {
    n = Math.floor(Math.random() * (cap - 1)) + 2;
  }
  return [m, n];
}

/**
 * Linearly mix two normalized RGB triples. `t` is 0..1 where 0 returns `a`
 * and 1 returns `b`.
 */
export function mixRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  const k = clamp(t, 0, 1);
  return [
    a[0] + (b[0] - a[0]) * k,
    a[1] + (b[1] - a[1]) * k,
    a[2] + (b[2] - a[2]) * k,
  ];
}

/**
 * Convert a CSS custom property color value to an RGB array (0..1) for use
 * as WebGL/Three.js uniforms. Accepts hex, rgb(), and rgba() strings.
 */
export function cssColorToRgb(
  value: string
): [r: number, g: number, b: number] {
  const trimmed = value.trim();

  // Hex
  if (trimmed.startsWith("#")) {
    const hex = trimmed.slice(1);
    const full = hex.length === 3
      ? hex.split("").map((c) => c + c).join("")
      : hex;
    const int = parseInt(full, 16);
    return [
      ((int >> 16) & 0xff) / 255,
      ((int >> 8) & 0xff) / 255,
      (int & 0xff) / 255,
    ];
  }

  // rgb/rgba
  const match = trimmed.match(/rgba?\(([^)]+)\)/);
  if (match) {
    const parts = match[1].split(/,\s*/).map(Number);
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
  }

  return [0, 0, 0];
}
