"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

interface IntroSlideProps {
  isInstant: boolean;
  onNext: () => void;
}

export function IntroSlide({ isInstant, onNext }: IntroSlideProps) {
  const { config } = useWelcomeConfig();
  const { intro } = config.onboarding;
  const [phase, setPhase] = useState<number>(() => (isInstant ? 2 : 0));

  useEffect(() => {
    if (isInstant) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 600));
    timers.push(setTimeout(() => setPhase(2), 1600));
    return () => timers.forEach(clearTimeout);
  }, [isInstant]);

  return (
    <div className="grid h-full w-full place-items-center">
      {/* Headline pinned to the vertical center of the viewport */}
      <div className="col-start-1 row-start-1 text-center">
        <div className="space-y-2">
          <p
            className={cn(
              "font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl",
              phase >= 0 ? "opacity-100" : "opacity-0",
              !isInstant && "transition-opacity duration-1000 ease-out"
            )}
          >
            {intro.hi}
          </p>
          <h1
            className={cn(
              "font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
              phase >= 1 ? "opacity-100" : "opacity-0",
              !isInstant && "transition-opacity duration-1000 ease-out"
            )}
          >
            {intro.welcome}
          </h1>
        </div>
      </div>

      {/* Button row sits a fixed distance below the centered headline */}
      <div
        className={cn(
          "col-start-1 row-start-1 transition-all duration-700 ease-out",
          phase >= 2
            ? "translate-y-[7rem] opacity-100 sm:translate-y-[8.5rem]"
            : "translate-y-[8rem] opacity-0 sm:translate-y-[9.5rem]"
        )}
      >
        <div className="flex items-center justify-center gap-4">
          <Button onClick={onNext} size="lg" className="rounded-full px-8">
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
