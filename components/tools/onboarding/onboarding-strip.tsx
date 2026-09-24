"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Onboarding } from "./index";

export function OnboardingStrip() {
  const { isCompleted, markComplete, mounted } = useOnboarding();
  const [tourOpen, setTourOpen] = useState(false);

  if (!mounted || isCompleted) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Onboarding tour"
      data-testid="onboarding-strip"
      className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden border-b bg-elevated px-4 py-2 sm:px-6"
    >
      {/* A faint wash of the Learn door's hue: this strip is a lesson. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-door-learn/10 to-transparent"
      />
      <p className="relative flex items-center gap-2.5 text-sm text-muted-foreground">
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-door-learn shadow-[0_0_8px_1px_color-mix(in_oklab,var(--color-door-learn)_60%,transparent)]"
        />
        New here? A short tour shows you how the Workshop fits together.
      </p>
      <div className="relative flex items-center gap-2">
        <Button size="sm" className="rounded-full px-3.5" onClick={() => setTourOpen(true)}>
          Take the tour
        </Button>
        <Button size="sm" variant="ghost" onClick={markComplete}>
          Dismiss
        </Button>
      </div>
      <Onboarding open={tourOpen} />
    </div>
  );
}
