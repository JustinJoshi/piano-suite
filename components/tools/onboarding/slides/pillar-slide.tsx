"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResourceCard } from "./resource-card";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

interface PillarSlideProps {
  pillarIndex: number;
  isInstant: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export function PillarSlide({
  pillarIndex,
  isInstant,
  onNext,
  onPrevious,
}: PillarSlideProps) {
  const { config } = useWelcomeConfig();
  const pillar = config.onboarding.pillars[pillarIndex];
  const resourceCardVariant = config.onboarding.resourceCardVariant;

  const [phase, setPhase] = useState<number>(() => (isInstant ? 2 : 0));

  useEffect(() => {
    if (isInstant) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase(1), 100));
    timers.push(
      setTimeout(
        () => setPhase(2),
        pillar.nextDelayMs > 0 ? 1200 + pillar.nextDelayMs : 1800
      )
    );

    return () => timers.forEach(clearTimeout);
  }, [isInstant, pillar.nextDelayMs]);

  if (!pillar) return null;

  const showContent = phase >= 1 || isInstant;
  const showButton = phase >= 2 || isInstant;

  return (
    <div className="flex flex-1 flex-col py-4 sm:py-8">
      <div className="text-center">
        <h2
          className={cn(
            "inline-block font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl",
            phase >= 1
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
          "mx-auto mt-4 max-w-2xl space-y-3 text-center sm:mt-6",
          showContent
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
          "mt-6 grid gap-3 sm:mt-8",
          resourceCardVariant === "compact-list"
            ? "grid-cols-1"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {pillar.resources.map((resource, index) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            visible={showContent}
            delayIndex={index}
            isInstant={isInstant}
            variant={resourceCardVariant}
          />
        ))}
      </div>

      <div
        className={cn(
          "mt-auto flex items-center justify-center gap-4 pb-4 pt-6 sm:pb-8 sm:pt-8",
          showButton
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0",
          !isInstant && "transition-all duration-700 ease-out"
        )}
      >
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
  );
}
