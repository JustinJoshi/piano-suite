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
      className="bg-elevated flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2 sm:px-6"
    >
      <p className="text-sm text-muted-foreground">
        New here? A short tour shows you how the Workshop fits together.
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setTourOpen(true)}>
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
