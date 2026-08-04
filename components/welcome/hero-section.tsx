"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { scrimStrengthCss } from "@/lib/chladni-hero-settings";

function scrimStyleFromDarkness(scrimDarkness: number): CSSProperties {
  const strength = scrimStrengthCss(scrimDarkness);
  const topStrength = scrimStrengthCss(scrimDarkness * (40 / 70));
  return {
    "--hero-scrim-strength": strength,
    "--hero-scrim-top-strength": topStrength,
  } as CSSProperties;
}

export function HeroSection({
  settings,
}: {
  settings: { scrimDarkness: number };
}) {
  return (
    <section className="relative flex min-h-svh">
      {/* Quiet pocket for copy — pattern continues under later sections */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] hero-scrim"
        style={scrimStyleFromDarkness(settings.scrimDarkness)}
      />
      <div className="pointer-events-none absolute inset-0 z-[1] hero-glow opacity-30" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="flex max-w-2xl flex-col items-center gap-6 text-center md:items-start md:text-left">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
            a free tool kit for self-taught pianists
          </span>

          <h1 className="font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Learn piano with tools built for self-taught pianists.
          </h1>

          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Evidence-based drills, guided onboarding, and articles that teach you
            how to practice.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 md:justify-start">
            <Button
              size="lg"
              className="rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              Start learning
            </Button>
            <p className="text-xs text-muted-foreground">
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
