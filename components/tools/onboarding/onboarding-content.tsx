"use client";

import { IntroSlide } from "./slides/intro-slide";
import { PillarsOverviewSlide } from "./slides/pillars-overview-slide";
import { PillarSlide } from "./slides/pillar-slide";
import { ClosingSlide } from "./slides/closing-slide";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

interface OnboardingContentProps {
  currentSlide: number;
  isInstant: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
}

export function OnboardingContent({
  currentSlide,
  isInstant,
  onNext,
  onPrevious,
  onComplete,
}: OnboardingContentProps) {
  const { config } = useWelcomeConfig();
  const { pillars } = config.onboarding;

  const totalSlides = 2 + pillars.length + 1; // intro + overview + pillars + closing

  return (
    <div className="absolute inset-0">
      {currentSlide === 0 && <IntroSlide isInstant={isInstant} onNext={onNext} />}
      {currentSlide === 1 && (
        <PillarsOverviewSlide
          isInstant={isInstant}
          onNext={onNext}
          onPrevious={onPrevious}
        />
      )}
      {currentSlide >= 2 && currentSlide < totalSlides - 1 && (
        <PillarSlide
          pillarIndex={currentSlide - 2}
          isInstant={isInstant}
          onNext={onNext}
          onPrevious={onPrevious}
        />
      )}
      {currentSlide === totalSlides - 1 && (
        <ClosingSlide
          isInstant={isInstant}
          onComplete={onComplete}
          onPrevious={onPrevious}
        />
      )}
    </div>
  );
}
