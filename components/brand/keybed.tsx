import { cn } from "@/lib/utils";
import { buildKeybedGeometry, type KeybedKey } from "@/lib/keybed";

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
  /** End on the next octave's C, like a real keyboard. */
  closingC?: boolean;
  className?: string;
};

const IVORY = "var(--color-ivory)";
const EBONY = "var(--color-ebony)";

/*
 * Key shading is built from translucent ebony/ivory overlays rather than
 * SVG gradients: gradients need document-unique ids, and these keybeds are
 * rendered from server components, dozens to a page. Overlays need none.
 *
 * All values are in the geometry's viewBox units (white key = 10 × 37).
 */

/** One white key: face, fallboard shadow at the top, and the front lip. */
export function WhiteKeyShape({
  k,
  lit = false,
  litColor = "var(--color-primary)",
  pressed = false,
}: {
  k: KeybedKey;
  lit?: boolean;
  litColor?: string;
  /** Draw the key sunk into the keybed (shorter lip, deeper top shadow). */
  pressed?: boolean;
}) {
  const lip = pressed ? 1.1 : 2.4;
  return (
    <g>
      <rect
        x={k.x}
        y={k.y}
        width={k.width}
        height={k.height}
        rx={0.6}
        fill={lit ? litColor : IVORY}
        style={{ transition: "fill 90ms ease" }}
      />
      {/* Shadow cast by the fallboard over the back of the key. */}
      <rect
        x={k.x}
        y={k.y}
        width={k.width}
        height={pressed ? 7 : 4.5}
        fill={EBONY}
        opacity={pressed ? 0.2 : 0.1}
      />
      {/* The front lip: the key's rounded nose, just catching shadow. */}
      <rect
        x={k.x}
        y={k.y + k.height - lip}
        width={k.width}
        height={lip}
        rx={0.6}
        fill={EBONY}
        opacity={lit ? 0.2 : 0.09}
      />
      {/* Hairline between keys: crisp at any scale. */}
      <rect
        x={k.x}
        y={k.y}
        width={k.width}
        height={k.height}
        rx={0.6}
        fill="none"
        stroke={EBONY}
        strokeOpacity={0.55}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}

/** The soft shadow a black key throws down-and-right onto its neighbours. */
export function BlackKeyShadowShape({ k }: { k: KeybedKey }) {
  return (
    <rect
      x={k.x + 0.9}
      y={k.y}
      width={k.width}
      height={k.height + 1.6}
      rx={0.8}
      fill={EBONY}
      opacity={0.2}
    />
  );
}

/** One black key: the flat top catches a little light, the sloped front doesn't. */
export function BlackKeyShape({
  k,
  lit = false,
  litColor = "var(--color-primary)",
  pressed = false,
}: {
  k: KeybedKey;
  lit?: boolean;
  litColor?: string;
  pressed?: boolean;
}) {
  const front = pressed ? 1.8 : 3.6;
  const inset = k.width * 0.16;
  return (
    <g>
      <rect
        x={k.x}
        y={k.y}
        width={k.width}
        height={k.height}
        rx={0.5}
        fill={lit ? litColor : EBONY}
        style={{ transition: "fill 90ms ease" }}
      />
      {/* Flat top face. */}
      <rect
        x={k.x + inset}
        y={k.y}
        width={k.width - inset * 2}
        height={k.height - front}
        rx={0.4}
        fill={IVORY}
        opacity={lit ? 0.16 : 0.07}
      />
      {/* Specular edge where the top meets the sloped front. */}
      <rect
        x={k.x + inset}
        y={k.y + k.height - front - 0.45}
        width={k.width - inset * 2}
        height={0.45}
        fill={IVORY}
        opacity={lit ? 0.3 : 0.16}
      />
    </g>
  );
}

/**
 * The strip above the keys: the ebony rail under the fallboard, with the
 * thin red key-slip felt every piano has along its bottom edge. `felt`
 * turns the whole rail to felt, for a softer edge on light cards.
 */
export function KeybedRail({
  width,
  height,
  felt = false,
}: {
  width: number;
  height: number;
  felt?: boolean;
}) {
  return (
    <g>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={felt ? "var(--color-door-play)" : EBONY}
        opacity={felt ? 0.55 : 1}
      />
      {!felt ? (
        <rect
          x={0}
          y={height - 0.9}
          width={width}
          height={0.9}
          fill="var(--color-door-play)"
          opacity={0.45}
        />
      ) : null}
    </g>
  );
}

/**
 * Decorative piano keybed. Purely presentational (aria-hidden): a brand
 * motif for section edges, door cards, and theme previews.
 *
 * Key colors are the two piano constants (`--ivory`, `--ebony`) so the
 * motif reads the same on every theme; lit keys use the theme's primary.
 *
 * The keybed stretches to its box (`preserveAspectRatio="none"`), which
 * suits a card edge of known size. For full-bleed edges whose width varies
 * with the viewport, use `KeybedStrip` so keys keep their proportions.
 */
export function Keybed({
  octaves = 2,
  lit = [],
  felt = false,
  litColor = "var(--color-primary)",
  closingC = false,
  className,
}: KeybedProps) {
  const geometry = buildKeybedGeometry(octaves, { closingC });
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
      <KeybedRail width={geometry.width} height={geometry.feltHeight} felt={felt} />
      {geometry.whiteKeys.map((key) => (
        <WhiteKeyShape
          key={`w-${key.semitone}`}
          k={key}
          lit={litSet.has(key.semitone)}
          litColor={litColor}
        />
      ))}
      {geometry.blackKeys.map((key) => (
        <BlackKeyShadowShape key={`s-${key.semitone}`} k={key} />
      ))}
      {geometry.blackKeys.map((key) => (
        <BlackKeyShape
          key={`b-${key.semitone}`}
          k={key}
          lit={litSet.has(key.semitone)}
          litColor={litColor}
        />
      ))}
    </svg>
  );
}
