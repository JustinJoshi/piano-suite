/**
 * Current config schema version per registered block type.
 *
 * Lives apart from the registry so the Convex-bundled `schemas.ts` can read
 * it without pulling in React (the registry imports icon and component
 * types). `registry.ts` spreads the same table into each definition, so
 * bumping a block's version here updates both sides at once.
 *
 * Bump a version when a block's config field names or semantics change, and
 * register a migration step for the old version in `blockMigrators`
 * (`schemas.ts`). Blocks stored above the current version are retained
 * as-is on read.
 */
export const blockConfigVersions: Record<string, number> = {
  metronome: 1,
  drillTimer: 1,
  chordSet: 1,
  textBlock: 1,
  midiConnectionBar: 1,
  drillShortcuts: 1,
  keyboardDisplay: 1,
  scaleRunner: 1,
  rootCycle: 1,
  progression: 1,
  sessionStats: 1,
  restTimer: 1,
  transport: 1,
  rhythmPattern: 1,
  targetDisplay: 1,
  chordLibrary: 1,
  scaleLibrary: 1,
  noteRoll: 1,
  pieceLibrary: 1,
  freePlay: 1,
  sectionLoop: 1,
  songPlayer: 1,
};

export function getBlockConfigVersion(type: string): number {
  return blockConfigVersions[type] ?? 1;
}
