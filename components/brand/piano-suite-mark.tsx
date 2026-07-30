"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  buildLogoMarkGeometry,
  LOGO_MARK_BAKED_PATTERN,
  LOGO_MARK_BAKED_PLATE,
} from "@/lib/logo-mark";
import {
  DEFAULT_LOGO_MARK_SETTINGS,
  type LogoMarkSettings,
} from "@/lib/logo-mark-settings";

export type PianoSuiteMarkProps = {
  settings?: LogoMarkSettings;
  className?: string;
  title?: string;
  /** When true, force baked amber fills (ignore theme / settings colors). */
  baked?: boolean;
};

function markSignature(settings: LogoMarkSettings): string {
  return [
    settings.mode[0],
    settings.mode[1],
    settings.threshold,
    settings.lineThickness,
    settings.zoom,
    settings.padding,
    settings.cornerRadius,
    settings.showPlate ? 1 : 0,
    settings.strokeOnly ? 1 : 0,
    settings.generation,
  ].join(":");
}

/**
 * Theme-aware Piano Suite brand mark (static Chladni nodal figure).
 * Uses `currentColor` for the pattern when `patternColor` is null.
 */
export function PianoSuiteMark({
  settings = DEFAULT_LOGO_MARK_SETTINGS,
  className,
  title = "Piano Suite",
  baked = false,
}: PianoSuiteMarkProps) {
  const signature = markSignature(settings);
  const geometry = useMemo(() => {
    void signature;
    return buildLogoMarkGeometry(settings);
  }, [settings, signature]);

  const patternFill = baked
    ? LOGO_MARK_BAKED_PATTERN
    : (settings.patternColor ?? "currentColor");
  const plateFill = baked
    ? LOGO_MARK_BAKED_PLATE
    : (settings.plateColor ?? "var(--color-background)");

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
      data-testid="piano-suite-mark"
      data-generation={settings.generation}
    >
      <title>{title}</title>
      {geometry.plate ? (
        <rect
          width={geometry.plate.size}
          height={geometry.plate.size}
          rx={geometry.plate.rx}
          fill={plateFill}
        />
      ) : null}
      {geometry.pathD ? (
        <path fill={patternFill} d={geometry.pathD} />
      ) : null}
    </svg>
  );
}
