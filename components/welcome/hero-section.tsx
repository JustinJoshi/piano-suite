"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Play } from "lucide-react";
import { scrimStrengthCss } from "@/lib/chladni-hero-settings";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { cn } from "@/lib/utils";

function scrimStyleFromDarkness(scrimDarkness: number): CSSProperties {
  const strength = scrimStrengthCss(scrimDarkness);
  const topStrength = scrimStrengthCss(scrimDarkness * (40 / 70));
  return {
    "--hero-scrim-strength": strength,
    "--hero-scrim-top-strength": topStrength,
  } as CSSProperties;
}

const backgroundEffectClasses = {
  none: "",
  "subtle-glow": "hero-glow opacity-30",
  orb: "hero-orb opacity-20",
  beam: "beam opacity-10",
};

export function HeroSection({
  settings,
}: {
  settings?: { scrimDarkness: number };
}) {
  const { config } = useWelcomeConfig();
  const { hero, styleTokens } = config;

  return (
    <section className="relative flex min-h-[calc(100svh-4rem)]">
      {/* Quiet pocket for copy — pattern continues under later sections */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] hero-scrim"
        style={scrimStyleFromDarkness(settings?.scrimDarkness ?? 0.7)}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[1]",
          backgroundEffectClasses[styleTokens.backgroundEffect]
        )}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
          {hero.showEyebrow ? (
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
              {hero.eyebrow}
            </span>
          ) : null}

          <h1
            className={cn(
              "font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl",
              styleTokens.headingFont === "sans" && "font-sans",
              styleTokens.headingFont === "mono" && "font-mono"
            )}
          >
            {hero.headline}
          </h1>

          <p
            className={cn(
              "max-w-lg text-lg leading-relaxed text-muted-foreground",
              styleTokens.bodyFont === "heading" && "font-heading",
              styleTokens.bodyFont === "mono" && "font-mono"
            )}
          >
            {hero.subheadline}
          </p>

          <div
            className="flex w-full flex-col items-center justify-center gap-4 pt-2 sm:flex-row"
          >
            <Link
              href={hero.ctaHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              {hero.ctaText}
            </Link>
            <p className="max-w-[16rem] text-xs text-muted-foreground sm:max-w-none">
              No account needed to explore. MIDI drills require{" "}
              <Link
                href="/articles/anki-ankiconnect-setup"
                className="text-primary underline-offset-2 hover:underline"
              >
                Anki + AnkiConnect
              </Link>{" "}
              and a keyboard.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
