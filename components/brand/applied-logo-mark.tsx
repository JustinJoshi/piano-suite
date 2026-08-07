"use client";

import { PianoSuiteMark } from "@/components/brand/piano-suite-mark";
import { useLogoMarkSettings } from "@/hooks/useLogoMarkSettings";
import { cn } from "@/lib/utils";

type AppliedLogoMarkProps = {
  className?: string;
  title?: string;
};

/** Brand mark bound to the applied logo settings (updates after Apply logo). */
export function AppliedLogoMark({ className, title }: AppliedLogoMarkProps) {
  const { settings } = useLogoMarkSettings();
  return (
    <PianoSuiteMark
      settings={settings}
      className={cn("text-primary", className)}
      title={title}
    />
  );
}
