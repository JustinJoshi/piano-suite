/**
 * The practice stream: one note event flowing from a source block through
 * transforms to a display block. This is a bare type file — no imports, no
 * React, no DOM — so it is safe for the Convex bundle.
 */
export type PracticeNote = {
  midi: number[];
  pcs: Set<number>;
  symbol: string;
  hand?: "left" | "right";
  onsetMs?: number;
  durationMs?: number;
  velocity?: number;
};
