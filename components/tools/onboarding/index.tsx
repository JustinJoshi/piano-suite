"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { OnboardingShell } from "./onboarding-shell";
import { OnboardingContent } from "./onboarding-content";

export function Onboarding() {
  const { config } = useWelcomeConfig();
  const { isCompleted, markComplete, isInstant, mounted } = useOnboarding();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [exiting, setExiting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalSlides = 2 + config.onboarding.pillars.length + 1;

  const goToNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide, totalSlides]);

  const handleComplete = useCallback(() => {
    setExiting(true);
    markComplete();
  }, [markComplete]);

  const handleSkip = useCallback(() => {
    setExiting(true);
    markComplete();
  }, [markComplete]);

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  }, [currentSlide]);

  if (!mounted || isCompleted) {
    return null;
  }

  const showShell = !exiting;

  return (
    <OnboardingShell
      ref={scrollRef}
      visible={showShell}
      isInstant={isInstant}
      onExited={() => setCurrentSlide(0)}
    >
      <div className="relative">
        {/* Skip control */}
        <div className="absolute -top-8 right-0 sm:-top-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip
          </Button>
        </div>

        <OnboardingContent
          currentSlide={currentSlide}
          isInstant={isInstant}
          onNext={goToNext}
          onComplete={handleComplete}
        />

        {/* Progress dots */}
        <div
          className={cn(
            "mt-10 flex justify-center gap-2",
            !isInstant && "transition-opacity duration-700 ease-out delay-500"
          )}
        >
          {Array.from({ length: totalSlides }).map((_, index) => (
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
