/**
 * Pure page-stream composer: sources in page order, then transforms applied
 * in page order. No React, no DOM, no Date.now().
 *
 * This file pulls generator code, so nothing Convex-bundled (schemas.ts,
 * target-blocks.ts) may import it.
 */

import type { PracticeNote } from "@/lib/practice-note";
import { getManifest } from "./manifest";
import { normalizeChordLibraryConfig } from "./chord-library/config";
import { generateChords } from "./chord-library/generate";
import { normalizeScaleLibraryConfig } from "./scale-library/config";
import { generateScale } from "./scale-library/generate";
import { normalizeRhythmPatternConfig } from "./rhythm-pattern/config";
import { transform as rhythmPatternTransform } from "./rhythm-pattern/transform";

export type StreamBlock = { id: string; type: string; config: unknown };

const DEFAULT_BPM = 120;

type SourceFn = (config: unknown) => PracticeNote[];
type TransformFn = (
  notes: PracticeNote[],
  config: unknown,
  bpm: number
) => PracticeNote[];

// Dispatch by block type. The manifest only *classifies* a block (source vs
// transform); it must never import generator code, so the functions live here.
const SOURCES: Record<string, SourceFn> = {
  chordLibrary: (raw) => generateChords(normalizeChordLibraryConfig(raw)),
  scaleLibrary: (raw) => generateScale(normalizeScaleLibraryConfig(raw)),
  // pieceLibrary adapts an uploaded MIDI file, which lives outside block
  // config, so it cannot contribute notes to a pure compose.
};

const TRANSFORMS: Record<string, TransformFn> = {
  rhythmPattern: (notes, raw, bpm) =>
    rhythmPatternTransform(notes, normalizeRhythmPatternConfig(raw), bpm),
};

/**
 * Compose the page's practice stream: every source block's output,
 * concatenated in page order, with every transform block applied in page
 * order. Returns [] when the page has no composable source.
 */
export function buildStream(
  blocks: StreamBlock[],
  bpm?: number
): PracticeNote[] {
  const tempo = bpm ?? DEFAULT_BPM;

  const notes: PracticeNote[] = [];
  for (const block of blocks) {
    if (getManifest(block.type)?.kind !== "source") continue;
    const generate = SOURCES[block.type];
    if (generate) notes.push(...generate(block.config));
  }

  let stream = notes;
  for (const block of blocks) {
    const apply = TRANSFORMS[block.type];
    if (apply) stream = apply(stream, block.config, tempo);
  }

  return stream;
}
