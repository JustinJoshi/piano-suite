"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

interface PillarsOverviewSlideProps {
  isInstant: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export function PillarsOverviewSlide({
  isInstant,
  onNext,
  onPrevious,
}: PillarsOverviewSlideProps) {
  const { config } = useWelcomeConfig();
  const { pillarsOverview } = config.onboarding;
  const [visible, setVisible] = useState<boolean>(() => isInstant);

  useEffect(() => {
    if (isInstant) return;
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, [isInstant]);

  return (
    <div className="grid h-full w-full place-items-center">
      {/* Headline pinned to the vertical center of the viewport */}
      <div className="col-start-1 row-start-1 px-4 text-center">
        <h2
          className={cn(
            "max-w-2xl font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
            visible ? "opacity-100" : "opacity-0",
            !isInstant && "transition-opacity duration-1000 ease-out"
          )}
        >
          {pillarsOverview}
        </h2>
      </div>

      {/* Button row sits a fixed distance below the centered headline */}
      <div
        className={cn(
          "col-start-1 row-start-1 transition-all duration-700 ease-out delay-700",
          visible
            ? "translate-y-[7rem] opacity-100 sm:translate-y-[8.5rem]"
            : "translate-y-[8rem] opacity-0 sm:translate-y-[9.5rem]"
        )}
      >
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={onPrevious}
            size="lg"
            className="rounded-full px-8"
          >
            Back
          </Button>
          <Button onClick={onNext} size="lg" className="rounded-full px-8">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
