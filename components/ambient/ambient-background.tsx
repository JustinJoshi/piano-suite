"use client";

import type { CSSProperties } from "react";
import {
  ambientScrimStrengthCss,
  type AmbientEffectKind,
} from "@/lib/ambient-effects";
import { AmbientEffectRenderer } from "@/components/ambient/ambient-effect-renderer";

export type AmbientBackgroundProps = {
  kind: AmbientEffectKind;
  scrimDarkness: number;
  /** Skip the full-page scrim (e.g. welcome page owns its hero scrim). */
  hideScrim?: boolean;
};

/**
 * Fixed full-bleed ambient background + optional readability scrim.
 */
export function AmbientBackground({
  kind,
  scrimDarkness,
  hideScrim = false,
}: AmbientBackgroundProps) {
  if (kind === "none") return null;

  const scrimStyle = {
    "--hero-scrim-strength": ambientScrimStrengthCss(scrimDarkness),
    "--hero-scrim-top-strength": ambientScrimStrengthCss(scrimDarkness * 0.55),
  } as CSSProperties;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      data-testid="ambient-background"
      data-kind={kind}
    >
      <div className="absolute inset-0">
        <AmbientEffectRenderer kind={kind} />
      </div>
      {!hideScrim && (
        <div className="absolute inset-0 z-[1] hero-scrim" style={scrimStyle} />
      )}
    </div>
  );
}
