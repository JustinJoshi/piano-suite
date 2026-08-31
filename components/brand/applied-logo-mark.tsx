"use client";

import { Music } from "lucide-react";
import { PianoSuiteMark } from "@/components/brand/piano-suite-mark";
import { useLogoMarkSettings } from "@/hooks/useLogoMarkSettings";
import { isShippingLogoMark } from "@/lib/logo-mark-settings";
import { cn } from "@/lib/utils";

type AppliedLogoMarkProps = {
  className?: string;
  title?: string;
};

/**
 * Brand mark bound to the applied logo settings: the musical-note mark is
 * the shipping default; a custom Logo Lab mark replaces it after Apply.
 */
export function AppliedLogoMark({ className, title }: AppliedLogoMarkProps) {
  const { settings } = useLogoMarkSettings();

  if (isShippingLogoMark(settings)) {
    return (
      <Music
        className={cn("text-primary", className)}
        aria-label={title ?? "Piano Suite"}
      />
    );
  }

  return (
    <PianoSuiteMark
      settings={settings}
      className={cn("text-primary", className)}
      title={title}
    />
  );
}
