"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/hooks/useOnboarding";
import { onboardingPillars } from "@/lib/onboarding";
import { OnboardingShell } from "@/components/tools/onboarding/onboarding-shell";
import { IntroSlide } from "@/components/tools/onboarding/slides/intro-slide";
import { PillarsOverviewSlide } from "@/components/tools/onboarding/slides/pillars-overview-slide";
import { PillarSlide } from "@/components/tools/onboarding/slides/pillar-slide";
import { ClosingSlide } from "@/components/tools/onboarding/slides/closing-slide";

const TOTAL_SLIDES = 2 + onboardingPillars.length + 1; // intro + overview + pillars + closing

export function Onboarding() {
  const { isCompleted, markComplete, isInstant, mounted } = useOnboarding();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [exiting, setExiting] = useState(false);

  const goToNext = useCallback(() => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide]);

  const handleComplete = useCallback(() => {
    setExiting(true);
    markComplete();
  }, [markComplete]);

  const handleSkip = useCallback(() => {
    setExiting(true);
    markComplete();
  }, [markComplete]);

  if (!mounted || isCompleted) {
    return null;
  }

  const showShell = !exiting;

  return (
    <OnboardingShell
      visible={showShell}
      isInstant={isInstant}
      onExited={() => setCurrentSlide(0)}
    >
      <div className="relative">
        {/* Skip control */}
        <div className="absolute -top-12 right-0 sm:-top-16">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip
          </Button>
        </div>

        {/* Slides */}
        <div className="relative">
          {currentSlide === 0 && <IntroSlide isInstant={isInstant} onNext={goToNext} />}
          {currentSlide === 1 && (
            <PillarsOverviewSlide isInstant={isInstant} onNext={goToNext} />
          )}
          {currentSlide >= 2 && currentSlide < TOTAL_SLIDES - 1 && (
            <PillarSlide
              pillar={onboardingPillars[currentSlide - 2]}
              isInstant={isInstant}
              onNext={goToNext}
            />
          )}
          {currentSlide === TOTAL_SLIDES - 1 && (
            <ClosingSlide isInstant={isInstant} onComplete={handleComplete} />
          )}
        </div>

        {/* Progress dots */}
        <div
          className={cn(
            "mt-10 flex justify-center gap-2",
            !isInstant && "transition-opacity duration-700 ease-out delay-500"
          )}
        >
          {Array.from({ length: TOTAL_SLIDES }).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === currentSlide
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      </div>
    </OnboardingShell>
  );
}
