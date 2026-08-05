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
}

export function PillarSlide({
  pillarIndex,
  isInstant,
  onNext,
}: PillarSlideProps) {
  const { config } = useWelcomeConfig();
  const pillar = config.onboarding.pillars[pillarIndex];
  const resourceCardVariant = config.onboarding.resourceCardVariant;

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

  if (!pillar) return null;

  return (
    <div className="flex min-h-[60vh] flex-col justify-center py-8 sm:min-h-[80vh] sm:py-12">
      <div className="text-center">
        <h2
          className={cn(
            "inline-block font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl",
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
          "mx-auto mt-6 max-w-2xl space-y-4 text-center sm:mt-8",
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
          "mt-8 grid gap-3 sm:mt-10",
          resourceCardVariant === "compact-list"
            ? "grid-cols-1"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {pillar.resources.map((resource, index) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            visible={contentVisible}
            delayIndex={index}
            isInstant={isInstant}
            variant={resourceCardVariant}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center sm:mt-10">
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
