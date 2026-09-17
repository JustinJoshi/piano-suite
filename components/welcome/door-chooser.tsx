"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Hammer, Play, type LucideIcon } from "lucide-react";
import { Keybed } from "@/components/brand/keybed";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import type { WelcomeDoorItemConfig } from "@/lib/welcome-config";
import { cn } from "@/lib/utils";
import { captureEvent } from "@/lib/analytics";

const DOOR_ICONS: Record<WelcomeDoorItemConfig["id"], LucideIcon> = {
  play: Play,
  build: Hammer,
  learn: BookOpen,
};

/**
 * Each door has its own hue (see `--door-*` in globals.css) so the three
 * paths stay recognisable everywhere they appear. Build borrows the Explore
 * hue: it is the door into the Workshop and its marketplace.
 */
const DOOR_TONES: Record<
  WelcomeDoorItemConfig["id"],
  { chip: string; glow: string; text: string; lit: number[]; litColor: string }
> = {
  play: {
    chip: "bg-door-play text-ebony",
    glow: "from-door-play/25",
    text: "text-door-play",
    lit: [0, 4, 7],
    litColor: "var(--color-door-play)",
  },
  build: {
    chip: "bg-door-explore text-ebony",
    glow: "from-door-explore/25",
    text: "text-door-explore",
    lit: [2, 5, 9, 12],
    litColor: "var(--color-door-explore)",
  },
  learn: {
    chip: "bg-door-learn text-ebony",
    glow: "from-door-learn/25",
    text: "text-door-learn",
    lit: [4, 7, 11],
    litColor: "var(--color-door-learn)",
  },
};

/**
 * The second screen (Phase 1.3): three doors instead of a dense page.
 *
 * Play and Build carry almost all the intent, so they get two large cards.
 * Learn is a smaller row underneath, not an equal third column — three
 * identical blocks imply an even traffic split that isn't real and read as
 * machine-made. Copy lives in `lib/welcome-config.ts` so `/dev/welcome-lab`
 * can tune it.
 */
export function DoorChooser() {
  const { config } = useWelcomeConfig();
  const { doors } = config;

  const primary = doors.items.filter((door) => door.id !== "learn");
  const secondary = doors.items.filter((door) => door.id === "learn");

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {doors.eyebrow}
          </span>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {doors.title}
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {primary.map((door) => {
            const Icon = DOOR_ICONS[door.id] ?? Play;
            const tone = DOOR_TONES[door.id];
            return (
              <Link
                key={door.id}
                href={door.href}
                data-testid={`door-${door.id}`}
                data-emphasis="primary"
                onClick={() => captureEvent("door_clicked", { doorId: door.id })}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-surface transition-all hover:-translate-y-1 hover:border-foreground/20 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <div
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 top-0 h-32 bg-gradient-to-b to-transparent opacity-80",
                    tone.glow
                  )}
                />
                <div className="relative flex flex-1 flex-col p-8">
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl shadow-key",
                      tone.chip
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-6 font-heading text-2xl font-semibold tracking-tight text-foreground">
                    {door.label}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {door.description}
                  </p>
                  <span
                    className={cn(
                      "mt-6 inline-flex items-center gap-1.5 text-sm font-semibold",
                      tone.text
                    )}
                  >
                    {door.id === "play" ? "Start playing" : "Open the Workshop"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
                <Keybed
                  octaves={3}
                  lit={tone.lit}
                  litColor={tone.litColor}
                  className="relative h-7 w-full opacity-90"
                />
              </Link>
            );
          })}
        </div>

        {secondary.map((door) => {
          const Icon = DOOR_ICONS[door.id] ?? BookOpen;
          const tone = DOOR_TONES[door.id];
          return (
            <Link
              key={door.id}
              href={door.href}
              data-testid={`door-${door.id}`}
              data-emphasis="secondary"
              onClick={() => captureEvent("door_clicked", { doorId: door.id })}
              className="group mt-5 flex items-center gap-4 rounded-2xl border border-border bg-card/70 px-5 py-4 shadow-surface transition-all hover:border-foreground/20 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  tone.chip
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-heading text-base font-semibold text-foreground">
                  {door.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {door.description}
                </span>
              </span>
              <ArrowRight
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                  tone.text
                )}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
