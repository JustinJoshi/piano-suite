import { getManifest } from "@/lib/feature-blocks/manifest";
import { isTargetBlockType } from "@/lib/feature-blocks/target-blocks";
import { blockSize, MAX_GRID_COLUMNS } from "@/lib/workshop-grid";
import { cn } from "@/lib/utils";

/** Rows taller than this are clipped in a thumbnail; it is a sketch, not a map. */
const MAX_THUMBNAIL_ROWS = 2;

/**
 * A miniature of a practice page: every block drawn at its real grid span
 * on the Workshop's 4-column layout, labelled with its library name. The
 * block that sets the page's targets (the first target block — the one the
 * runtime actually drills) is tinted in the Play hue, so "what will I be
 * playing?" is answerable at a glance.
 *
 * Decorative (`aria-hidden`): the card around it carries the real text.
 */
export function PageThumbnail({
  blocks,
  rows = 5,
  className,
}: {
  blocks: ReadonlyArray<{ type: string; size?: { w: number; h: number } }>;
  /**
   * Fixed number of 13px rows the sketch occupies, so a row of cards keeps
   * its titles aligned whatever each page holds; longer pages are clipped.
   */
  rows?: number;
  className?: string;
}) {
  const liveTarget = blocks.find((block) => isTargetBlockType(block.type));

  return (
    <div
      aria-hidden
      style={{ height: rows * 13 + (rows - 1) * 4 + 12 }}
      className={cn(
        "grid grid-flow-row-dense auto-rows-[13px] grid-cols-4 content-start gap-1 overflow-hidden rounded-xl border border-border bg-background/70 p-1.5 shadow-[inset_0_1px_2px_0_rgb(0_0_0/0.25)]",
        className
      )}
    >
      {blocks.map((block, index) => {
        const size = blockSize(block);
        const span = Math.min(MAX_GRID_COLUMNS, Math.max(1, size.w));
        const rowSpan = Math.min(MAX_THUMBNAIL_ROWS, Math.max(1, size.h));
        const label = getManifest(block.type)?.label ?? block.type;
        const isLive = block === liveTarget;
        return (
          <span
            key={`${block.type}-${index}`}
            style={{ gridColumn: `span ${span}`, gridRow: `span ${rowSpan}` }}
            className={cn(
              "flex min-w-0 items-start overflow-hidden rounded-[5px] border px-1.5 pt-[3px] text-[0.56rem] font-medium leading-none tracking-wide",
              isLive
                ? "border-door-play/40 bg-door-play/15 text-door-play"
                : "border-border bg-elevated text-muted-foreground"
            )}
          >
            <span className="truncate">{label}</span>
          </span>
        );
      })}
    </div>
  );
}
