"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResourceCard } from "@/components/tools/onboarding/resource-card";
import type { OnboardingPillar } from "@/lib/onboarding";

interface PillarSlideProps {
  pillar: OnboardingPillar;
  isInstant: boolean;
  onNext: () => void;
}

export function PillarSlide({ pillar, isInstant, onNext }: PillarSlideProps) {
  const [titleVisible, setTitleVisible] = useState<boolean>(() => isInstant);
  const [contentVisible, setContentVisible] = useState<boolean>(() => isInstant);
  const [buttonVisible, setButtonVisible] = useState<boolean>(() => isInstant);

  useEffect(() => {
    if (isInstant) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setTitleVisible(true), 100));
    timers.push(setTimeout(() => setContentVisible(true), 900));
    timers.push(
      setTimeout(
        () => setButtonVisible(true),
        pillar.nextDelayMs > 0 ? 900 + pillar.nextDelayMs : 1200
      )
    );

    return () => timers.forEach(clearTimeout);
  }, [isInstant, pillar.nextDelayMs]);

  return (
    <div className="flex min-h-[80vh] flex-col justify-center py-12">
      <div className="text-center">
        <h2
          className={cn(
            "inline-block font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
            titleVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0",
            !isInstant && "transition-all duration-1000 ease-out"
          )}
        >
          {pillar.headline}
        </h2>
      </div>

      <div
        className={cn(
          "mx-auto mt-8 max-w-2xl space-y-4 text-center",
          contentVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0",
          !isInstant && "transition-all duration-1000 ease-out"
        )}
      >
        {pillar.body.map((paragraph, index) => (
          <p
            key={index}
            className="text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {paragraph}
          </p>
        ))}
      </div>

      <div
        className={cn(
          "mt-10 grid gap-4 sm:grid-cols-3",
          contentVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0",
          !isInstant && "transition-all duration-1000 ease-out delay-200"
        )}
      >
        {pillar.resources.map((resource, index) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            visible={contentVisible}
            delayIndex={index}
            isInstant={isInstant}
          />
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <div
          className={cn(
            buttonVisible
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
    </div>
  );
}
