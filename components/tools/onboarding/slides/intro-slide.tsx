"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { introSlides } from "@/lib/onboarding";

interface IntroSlideProps {
  isInstant: boolean;
  onNext: () => void;
}

export function IntroSlide({ isInstant, onNext }: IntroSlideProps) {
  const [phase, setPhase] = useState<number>(() => (isInstant ? 2 : 0));

  useEffect(() => {
    if (isInstant) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 600));
    timers.push(setTimeout(() => setPhase(2), 1600));
    return () => timers.forEach(clearTimeout);
  }, [isInstant]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <div className="space-y-2">
        <p
          className={cn(
            "font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl",
            phase >= 0 ? "opacity-100" : "opacity-0",
            !isInstant && "transition-opacity duration-1000 ease-out"
          )}
        >
          {introSlides.hi}
        </p>
        <h1
          className={cn(
            "font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
            phase >= 1 ? "opacity-100" : "opacity-0",
            !isInstant && "transition-opacity duration-1000 ease-out"
          )}
        >
          {introSlides.welcome}
        </h1>
      </div>

      <div
        className={cn(
          "mt-10",
          phase >= 2
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0",
          !isInstant && "transition-all duration-700 ease-out"
        )}
      >
        <Button onClick={onNext} size="lg" className="rounded-full px-8">
          Next
        </Button>
      </div>
    </div>
  );
}
