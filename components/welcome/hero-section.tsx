"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const ChladniBackground = dynamic(
  () => import("./chladni-background").then((mod) => mod.ChladniBackground),
  { ssr: false }
);

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated Chladni figure background */}
      <ChladniBackground />

      {/* Background glow layer */}
      <div className="absolute inset-0 hero-glow opacity-70" />

      <div className="hero-container relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Text column */}
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
            blocked practice — anki verified
          </span>

          <h1 className="font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Anki decides what to drill.{" "}
            <span className="text-primary">Your hands prove you know it.</span>
          </h1>

          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            A chord drill that takes its orders from your Anki reviews, checks
            your playing on a real MIDI keyboard, and reports the result straight
            back — so the same spaced-repetition schedule that teaches you the
            theory also teaches your hands.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              size="lg"
              className="rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
            >
              <Play className="mr-2 h-4 w-4 fill-current" />
              Enter the drill
            </Button>
            <p className="text-xs text-muted-foreground">
              Needs Anki + AnkiConnect and a MIDI keyboard.
            </p>
          </div>
        </div>

        {/* Visual column */}
        <div className="relative hidden h-[420px] items-center justify-center lg:flex">
          {/* Orbiting decorative shapes */}
          <div className="absolute h-[360px] w-[360px] rounded-full border border-primary/10" />
          <div className="absolute h-[260px] w-[260px] rounded-full border border-primary/20" />

          {/* Main glowing orb */}
          <div className="hero-orb relative h-40 w-40 rounded-full" />

          {/* Cross beam */}
          <div className="beam absolute h-1 w-[120%] rotate-[-20deg]" />
          <div className="beam absolute h-1 w-[120%] rotate-[35deg] opacity-60" />

          {/* Floating chips */}
          <div className="absolute right-8 top-12 rounded-full border border-primary/20 bg-card/80 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
            FSRS scheduler
          </div>
          <div className="absolute bottom-16 left-10 rounded-full border border-primary/20 bg-card/80 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
            Web MIDI
          </div>
          <div className="absolute left-20 top-24 rounded-full border border-primary/20 bg-card/80 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
            Auto-grade
          </div>
        </div>
      </div>
    </section>
  );
}
