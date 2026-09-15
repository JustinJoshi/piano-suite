import { cn } from "@/lib/utils";
import { buildKeybedGeometry } from "@/lib/keybed";

export type KeybedProps = {
  /** Number of octaves to draw (7 white keys each). */
  octaves?: number;
  /**
   * Semitone offsets from the first C to light in the brand color, e.g.
   * `[0, 4, 7]` lights a C major triad. Offsets beyond the keybed are ignored.
   */
  lit?: number[];
  /** Also draw the thin felt strip above the keys. */
  felt?: boolean;
  /**
   * CSS color for lit keys. Defaults to the theme primary; door cards pass
   * their door hue (`var(--color-door-play)`) so the motif matches the card.
   */
  litColor?: string;
  className?: string;
};

/**
 * Decorative piano keybed. Purely presentational (aria-hidden): a brand
 * motif for section edges, footers, door cards, and theme previews.
 *
 * Key colors are the two piano constants (`--ivory`, `--ebony`) so the
 * motif reads the same on every theme; lit keys use the theme's primary.
 */
export function Keybed({
  octaves = 2,
  lit = [],
  felt = false,
  litColor = "var(--color-primary)",
  className,
}: KeybedProps) {
  const geometry = buildKeybedGeometry(octaves);
  const litSet = new Set(lit);

  return (
    <svg
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn("block", className)}
      data-testid="keybed"
    >
      {felt ? (
        <rect
          x={0}
          y={0}
          width={geometry.width}
          height={geometry.feltHeight}
          fill="var(--color-door-play)"
          opacity={0.55}
        />
      ) : null}
      {geometry.whiteKeys.map((key) => (
        <rect
          key={`w-${key.semitone}`}
          x={key.x}
          y={key.y}
          width={key.width}
          height={key.height}
          rx={0.6}
          fill={litSet.has(key.semitone) ? litColor : "var(--color-ivory)"}
          stroke="var(--color-ebony)"
          strokeWidth={0.5}
        />
      ))}
      {geometry.blackKeys.map((key) => (
        <rect
          key={`b-${key.semitone}`}
          x={key.x}
          y={key.y}
          width={key.width}
          height={key.height}
          rx={0.5}
          fill={litSet.has(key.semitone) ? litColor : "var(--color-ebony)"}
        />
      ))}
    </svg>
  );
}
