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
    <div className="flex min-h-[60vh] flex-col items-center py-8 sm:min-h-[80vh] sm:py-12">
      {/* Top spacer collapses when content appears, pulling the title upward. */}
      <div
        className={cn(
          "w-full transition-all duration-1000 ease-out",
          showContent ? "flex-[0]" : "flex-1"
        )}
      />

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

      {/* Bottom spacer collapses when content appears. */}
      <div
        className={cn(
          "w-full transition-all duration-1000 ease-out",
          showContent ? "flex-[0]" : "flex-1"
        )}
      />

      {/* Content is clipped in phase 0 so it does not push the title. */}
      <div
        className={cn(
          "w-full overflow-hidden transition-all duration-1000 ease-out",
          showContent
            ? "max-h-[2000px] opacity-100"
            : "max-h-0 opacity-0"
        )}
      >
        <div className="mx-auto mt-6 max-w-2xl space-y-4 text-center sm:mt-8">
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
              visible={showContent}
              delayIndex={index}
              isInstant={isInstant}
              variant={resourceCardVariant}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center sm:mt-10">
          <div
            className={cn(
              showButton
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
    </div>
  );
}
