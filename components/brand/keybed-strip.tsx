"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { buildStripOctave, STRIP_BLACK_KEY_DEPTH } from "@/lib/keybed";

export type KeybedStripProps = {
  /** Width of one white key in CSS pixels. Height comes from `className`. */
  keyWidth?: number;
  className?: string;
};

const IVORY = "var(--color-ivory)";
const EBONY = "var(--color-ebony)";

/**
 * A full-bleed keybed that keeps real key proportions at any width.
 *
 * One octave is drawn into an SVG `<pattern>` measured in pixels and tiled
 * across the box, so a 1440px footer and a 375px footer both show keys of
 * the same width — the stretched `Keybed` would squash them into squares.
 * Use `Keybed` when you need lit keys; use this for edges and footers.
 */
export function KeybedStrip({ keyWidth = 18, className }: KeybedStripProps) {
  const rawId = useId();
  const id = `kb${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { tileWidth, blackKeyWidth, blackKeyX } = buildStripOctave(keyWidth);
  const width = tileWidth / 7;
  const blackDepth = `${STRIP_BLACK_KEY_DEPTH * 100}%`;
  const shadowDepth = `${(STRIP_BLACK_KEY_DEPTH + 0.05) * 100}%`;
  const topFaceDepth = `${(STRIP_BLACK_KEY_DEPTH - 0.08) * 100}%`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cn("block w-full", className)}
      data-testid="keybed"
    >
      <defs>
        <pattern
          id={`${id}-octave`}
          width={tileWidth}
          height="100%"
          patternUnits="userSpaceOnUse"
        >
          <rect x={0} y={0} width={tileWidth} height="100%" fill={IVORY} />
          {Array.from({ length: 7 }, (_, index) => (
            <rect
              key={`w-${index}`}
              x={index * width}
              y={0}
              width={1}
              height="100%"
              fill={EBONY}
              opacity={0.5}
            />
          ))}
          {blackKeyX.map((x) => (
            <rect
              key={`s-${x}`}
              x={x + Math.max(1, width * 0.08)}
              y={0}
              width={blackKeyWidth}
              height={shadowDepth}
              rx={Math.max(1, width * 0.08)}
              fill={EBONY}
              opacity={0.2}
            />
          ))}
          {blackKeyX.map((x) => (
            <g key={`b-${x}`}>
              <rect
                x={x}
                y={0}
                width={blackKeyWidth}
                height={blackDepth}
                rx={Math.max(1, width * 0.07)}
                fill={EBONY}
              />
              <rect
                x={x + blackKeyWidth * 0.16}
                y={0}
                width={blackKeyWidth * 0.68}
                height={topFaceDepth}
                rx={1}
                fill={IVORY}
                opacity={0.07}
              />
            </g>
          ))}
        </pattern>
        {/* Fallboard shadow at the top, the keys' front lip at the bottom. */}
        <linearGradient id={`${id}-light`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={EBONY} stopOpacity={0.35} />
          <stop offset="0.14" stopColor={EBONY} stopOpacity={0} />
          <stop offset="0.88" stopColor={EBONY} stopOpacity={0} />
          <stop offset="0.9" stopColor={EBONY} stopOpacity={0.08} />
          <stop offset="1" stopColor={EBONY} stopOpacity={0.2} />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id}-octave)`} />
      <rect width="100%" height="100%" fill={`url(#${id}-light)`} />
    </svg>
  );
}
