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
    <section className="relative flex min-h-svh overflow-hidden">
      <ChladniBackground />

      {/* Quiet pocket for copy + fade into the next section */}
      <div className="pointer-events-none absolute inset-0 z-[1] hero-scrim" />
      <div className="pointer-events-none absolute inset-0 z-[1] hero-glow opacity-30" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="flex max-w-2xl flex-col items-start gap-6">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-primary">
            blocked practice — anki verified
          </span>

          <h1 className="font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Anki decides what to drill.{" "}
            <span className="text-primary">Your hands prove you know it.</span>
          </h1>

          <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
            Chord drills driven by your Anki reviews, scored on a real MIDI
            keyboard, and graded back into the same spaced-repetition loop.
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
      </div>
    </section>
  );
}
