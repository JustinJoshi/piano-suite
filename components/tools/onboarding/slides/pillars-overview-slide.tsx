"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { introSlides } from "@/lib/onboarding";

interface PillarsOverviewSlideProps {
  isInstant: boolean;
  onNext: () => void;
}

export function PillarsOverviewSlide({
  isInstant,
  onNext,
}: PillarsOverviewSlideProps) {
  const [visible, setVisible] = useState<boolean>(() => isInstant);

  useEffect(() => {
    if (isInstant) return;
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, [isInstant]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <h2
        className={cn(
          "max-w-2xl font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
          visible ? "opacity-100" : "opacity-0",
          !isInstant && "transition-opacity duration-1000 ease-out"
        )}
      >
        {introSlides.pillarsOverview}
      </h2>

      <div
        className={cn(
          "mt-10",
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0",
          !isInstant && "transition-all duration-700 ease-out delay-700"
        )}
      >
        <Button onClick={onNext} size="lg" className="rounded-full px-8">
          Next
        </Button>
      </div>
    </div>
  );
}
