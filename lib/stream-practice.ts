import { activeTargetBlock } from "./feature-blocks/target-blocks";

/**
 * The block types that turn a source-only page into a graded one. A page
 * with at least one of these (and no explicit target block) grades itself
 * against the stream via the runtime's fallback targets.
 */
const SOURCE_PRACTICE_TRIGGER_BLOCKS = new Set([
  "targetDisplay",
  "drillTimer",
  "transport",
]);

/**
 * Whether a page's stream should become its drill targets: an empty pageId
 * is a preview (never graded), an explicit target block owns the page, and
 * without a display/timer/transport block there is nothing to run the
 * targets (a freePlay-only page stays ungraded).
 */
export function sourcePracticeCapable(
  blocks: ReadonlyArray<{ type: string }>,
  pageId: string
): boolean {
  if (pageId === "") return false;
  if (activeTargetBlock(blocks)) return false;
  return blocks.some((b) => SOURCE_PRACTICE_TRIGGER_BLOCKS.has(b.type));
}
