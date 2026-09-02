/**
 * Key-cycle orders shared by the root-cycle and progression blocks.
 *
 * "Run one idea through all twelve keys" is the single most commonly
 * prescribed intermediate drill, and the order matters: the cycle of fourths
 * is the one that mirrors real harmonic motion, while chromatic and random
 * orders test recall rather than muscle memory.
 *
 * Free of React, DOM, MIDI, and Convex dependencies.
 */

import { ROOTS, type Root, normalizePc } from "./music-theory";

export const KEY_CYCLE_ORDERS = [
  "fourths",
  "fifths",
  "chromatic",
  "random",
] as const;
export type KeyCycleOrder = (typeof KEY_CYCLE_ORDERS)[number];

export const KEY_CYCLE_ORDER_LABELS: Record<KeyCycleOrder, string> = {
  fourths: "Circle of fourths (C F Bb…)",
  fifths: "Circle of fifths (C G D…)",
  chromatic: "Chromatic (C Db D…)",
  random: "Random",
};

export function isKeyCycleOrder(value: unknown): value is KeyCycleOrder {
  return (
    typeof value === "string" &&
    (KEY_CYCLE_ORDERS as readonly string[]).includes(value)
  );
}

function rootForPc(pc: number): Root {
  const normalized = normalizePc(pc);
  return ROOTS.find((r) => r.pc === normalized) ?? ROOTS[0];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * The ordered pitch classes for a cycle, starting from `startPc`.
 *
 * `random` is shuffled but always begins at `startPc`, so a drill still opens
 * in the key the user chose.
 */
export function buildKeyCyclePcs(
  order: KeyCycleOrder,
  startPc: number,
  random: () => number = Math.random
): number[] {
  const start = normalizePc(startPc);

  if (order === "random") {
    const rest = ROOTS.map((r) => r.pc).filter((pc) => pc !== start);
    return [start, ...shuffle(rest, random)];
  }

  const step = order === "fourths" ? 5 : order === "fifths" ? 7 : 1;
  return Array.from({ length: 12 }, (_, i) => normalizePc(start + i * step));
}

/** Same as `buildKeyCyclePcs` but resolved to spelled `Root` values. */
export function buildKeyCycleRoots(
  order: KeyCycleOrder,
  startPc: number,
  random: () => number = Math.random
): Root[] {
  return buildKeyCyclePcs(order, startPc, random).map(rootForPc);
}

/** Look up a `Root` by name, falling back to C for unknown names. */
export function rootByName(name: string): Root {
  return ROOTS.find((r) => r.name === name) ?? ROOTS[0];
}
