"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";
import { OnboardingShell } from "@/components/tools/onboarding/onboarding-shell";
import { OnboardingContent } from "@/components/tools/onboarding/onboarding-content";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

function PillarsDeck() {
  const { config } = useWelcomeConfig();
  const [slide, setSlide] = useState(0);
  const totalSlides = 2 + config.onboarding.pillars.length + 1;

  return (
    <div className="relative mx-auto mt-8 h-[560px] max-w-3xl">
      <OnboardingShell visible isInstant mode="inline">
        <div className="relative py-6">
          <OnboardingContent
            currentSlide={slide}
            isInstant
            onNext={() => setSlide((s) => Math.min(s + 1, totalSlides - 1))}
            onPrevious={() => setSlide((s) => Math.max(s - 1, 0))}
            onComplete={() => setSlide(0)}
          />
        </div>
      </OnboardingShell>
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setSlide(i)}
            className={
              i === slide
                ? "h-1.5 w-6 rounded-full bg-primary transition-all duration-300"
                : "h-1.5 w-1.5 rounded-full bg-muted-foreground/30 transition-all duration-300 hover:bg-muted-foreground/50"
            }
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Phase 1.7: the three pillars of practice, published where people who
 * want to read can find them (the Learn door, /articles, and /settings)
 * instead of gating the Workshop behind a fullscreen deck.
 */
export default function PracticePillarsPage() {
  return (
    <WelcomeConfigProvider>
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 pb-16">
          <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
            <Link
              href="/articles"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              All articles
            </Link>
            <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              The three pillars of practice
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              The short introduction new pianists see — active recall, hand
              care, and managing frustration. Step through the deck, or read
              the{" "}
              <Link
                href="/articles/three-pillars-of-practice"
                className="text-primary underline-offset-4 hover:underline"
              >
                full article
              </Link>
              .
            </p>
          </div>
          <PillarsDeck />
        </main>
      </div>
    </WelcomeConfigProvider>
  );
}
