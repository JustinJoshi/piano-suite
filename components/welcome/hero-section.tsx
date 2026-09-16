"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { Keybed } from "@/components/brand/keybed";
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

/** Cmaj7 — the first "grown-up" chord most self-taught players learn. */
const HERO_CHORD = [0, 4, 7, 11, 12 + 4];

/**
 * Split a headline on its first em dash so the second clause can be set in
 * the italic display cut. Headlines without a dash render unchanged.
 */
function splitHeadline(headline: string): [string, string | null] {
  const index = headline.indexOf("—");
  if (index === -1) return [headline, null];
  return [headline.slice(0, index).trimEnd(), headline.slice(index + 1).trim()];
}

export function HeroSection({
  settings,
}: {
  settings?: { scrimDarkness: number };
}) {
  const { config } = useWelcomeConfig();
  const { hero, styleTokens, templateStrip } = config;
  const [lead, tail] = splitHeadline(hero.headline);

  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] flex-col">
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

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex max-w-3xl flex-col gap-7",
            hero.align === "center"
              ? "items-center text-center"
              : "items-start text-left"
          )}
        >
          {hero.showEyebrow ? (
            <span className="rise-in inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[0.62rem] font-medium uppercase tracking-[0.1em] text-primary backdrop-blur-sm sm:text-xs sm:tracking-[0.18em]">
              <span aria-hidden className="hidden text-sm leading-none sm:inline">
                ♪
              </span>
              {hero.eyebrow}
            </span>
          ) : null}

          <h1
            className={cn(
              "rise-in rise-in-delay-1 font-heading text-[2.6rem] font-semibold leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl",
              styleTokens.headingFont === "sans" && "font-sans",
              styleTokens.headingFont === "mono" && "font-mono"
            )}
          >
            {lead}
            {tail ? (
              <>
                {" "}
                <span className="block text-accent italic font-medium sm:inline">
                  — {tail}
                </span>
              </>
            ) : null}
          </h1>

          <p
            className={cn(
              "rise-in rise-in-delay-2 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl",
              styleTokens.bodyFont === "heading" && "font-heading",
              styleTokens.bodyFont === "mono" && "font-mono"
            )}
          >
            {hero.subheadline}
          </p>

          <div
            className={cn(
              "rise-in rise-in-delay-3 flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row sm:items-center",
              hero.align === "center" && "justify-center"
            )}
          >
            <Link
              href={hero.ctaHref}
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full px-7 text-base"
              )}
            >
              <Play className="h-4 w-4 fill-current" />
              {hero.ctaText}
            </Link>
            <Link
              href={templateStrip.browseHref}
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "rounded-full px-5 text-base text-foreground/90"
              )}
            >
              See what others built
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="rise-in rise-in-delay-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Everything&apos;s free to try — explore the community gallery freely
            and sign in only when you&apos;d like to keep your own pages.
          </p>
        </div>
      </div>

      {/* Stage edge: a keybed with a lit Cmaj7 that hands off to the content. */}
      <div
        aria-hidden
        className="pointer-events-none relative z-[2] mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8"
      >
        <div className="relative overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card/70 shadow-raised backdrop-blur-sm">
          <div className="h-3 w-full bg-gradient-to-b from-door-play/35 to-transparent" />
          <Keybed
            octaves={5}
            lit={HERO_CHORD}
            className="h-14 w-full opacity-95 sm:h-20"
          />
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
        </div>
      </div>
    </section>
  );
}
