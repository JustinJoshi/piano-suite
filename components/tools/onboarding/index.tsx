"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { OnboardingShell } from "./onboarding-shell";
import { OnboardingContent } from "./onboarding-content";

export function Onboarding() {
  const { config } = useWelcomeConfig();
  const { isCompleted, markComplete, isInstant, mounted } = useOnboarding();
  const { isSignedIn, authDisabled } = useAuthAccess();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [exiting, setExiting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalSlides = 2 + config.onboarding.pillars.length + 1;

  const goToNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  }, [currentSlide, totalSlides]);

  const goToPrevious = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
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

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  }, [currentSlide]);

  // Anonymous visitors are not in the product yet; the deck stays for the
  // first signed-in session. Keeps public pages (workshop, Pattern Lab)
  // free of the fullscreen overlay.
  if (!mounted || isCompleted || (!isSignedIn && !authDisabled)) {
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
      <div className="relative flex min-h-screen flex-col">
        {/* Skip control */}
        <div className="absolute right-0 top-0 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip
          </Button>
        </div>

        {/* Slides fill the full viewport so text can be centered in it */}
        <div className="relative flex-1">
          <OnboardingContent
            currentSlide={currentSlide}
            isInstant={isInstant}
            onNext={goToNext}
            onPrevious={goToPrevious}
            onComplete={handleComplete}
          />
        </div>

        {/* Progress line anchored at the bottom */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6",
            !isInstant && "transition-opacity duration-700 ease-out delay-500"
          )}
        >
          <div className="relative h-1 w-full max-w-xs overflow-hidden rounded-full bg-muted-foreground/20 mx-auto">
            <div
              className={cn(
                "absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-500 ease-out",
                !isInstant && "shadow-[0_0_8px_2px_var(--primary-glow)]"
              )}
              style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-center text-xs text-muted-foreground">
            {currentSlide + 1} / {totalSlides}
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
