/**
 * Pure Julia-set math.
 *
 * The Julia set for a complex parameter c is the set of starting points z₀
 * that remain bounded under the iteration z ↦ z² + c. Escape-time coloring
 * shades each pixel by how quickly |z| exceeds a radius.
 */

import { clamp, lerp } from "@/lib/chladni";

/** Complex number as a real/imaginary pair. */
export type Complex = [re: number, im: number];

export type JuliaPreset = {
  label: string;
  c: Complex;
};

/**
 * Curated (c) values that produce attractive Julia figures.
 * These are classic demo loci near the Mandelbrot boundary.
 */
export const JULIA_PRESETS: JuliaPreset[] = [
  { label: "Seahorse", c: [-0.75, 0.11] },
  { label: "Dendrite", c: [-0.12, 0.77] },
  { label: "Spiral", c: [-0.8, 0.156] },
  { label: "Dragon", c: [0.285, 0.01] },
  { label: "Dust", c: [-0.4, 0.6] },
];

/** Square of the modulus of a complex number. */
export function complexMod2(z: Complex): number {
  return z[0] * z[0] + z[1] * z[1];
}

/** One Julia iteration: z ↦ z² + c. */
export function juliaIterate(z: Complex, c: Complex): Complex {
  const [zr, zi] = z;
  const [cr, ci] = c;
  return [zr * zr - zi * zi + cr, 2 * zr * zi + ci];
}

/**
 * Escape-time iteration count for a single point.
 * Returns the iteration at which |z| exceeded escapeRadius, or maxIterations
 * if the orbit stayed bounded.
 */
export function juliaEscapeIterations(
  z0: Complex,
  c: Complex,
  maxIterations: number,
  escapeRadius = 4
): number {
  const escape2 = escapeRadius * escapeRadius;
  let z: Complex = [z0[0], z0[1]];
  for (let i = 0; i < maxIterations; i++) {
    if (complexMod2(z) > escape2) return i;
    z = juliaIterate(z, c);
  }
  return maxIterations;
}

/**
 * Smooth continuous escape value in [0, maxIterations].
 * Uses the standard log-log correction so color bands do not look stepped.
 * Returns maxIterations for points that never escape.
 */
export function juliaSmoothEscape(
  z0: Complex,
  c: Complex,
  maxIterations: number,
  escapeRadius = 4
): number {
  const escape2 = escapeRadius * escapeRadius;
  let z: Complex = [z0[0], z0[1]];
  for (let i = 0; i < maxIterations; i++) {
    const mod2 = complexMod2(z);
    if (mod2 > escape2) {
      // Smooth: i + 1 - log2(log2(|z|))
      const logZn = Math.log(mod2) / 2; // log(|z|)
      const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
      return i + 1 - nu;
    }
    z = juliaIterate(z, c);
  }
  return maxIterations;
}

/** Linearly interpolate two complex numbers. */
export function lerpComplex(a: Complex, b: Complex, t: number): Complex {
  const k = clamp(t, 0, 1);
  return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
}

/**
 * Pick a random Julia c near interesting Mandelbrot-boundary loci.
 * Samples within a disk of radius `radius` centered at the origin, biased
 * slightly outward so interior (connected) disks are less common.
 */
export function randomC(radius = 1.2): Complex {
  const r = Math.sqrt(0.3 + Math.random() * 0.7) * radius;
  const theta = Math.random() * Math.PI * 2;
  return [
    Math.round(r * Math.cos(theta) * 1000) / 1000,
    Math.round(r * Math.sin(theta) * 1000) / 1000,
  ];
}

/** Clamp a complex pair component-wise into [min, max]. */
export function clampComplex(c: Complex, min = -2, max = 2): Complex {
  return [clamp(c[0], min, max), clamp(c[1], min, max)];
}
