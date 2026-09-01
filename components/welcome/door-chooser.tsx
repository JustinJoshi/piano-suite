"use client";

import Link from "next/link";
import { BookOpen, Hammer, Play, type LucideIcon } from "lucide-react";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import type { WelcomeDoorItemConfig } from "@/lib/welcome-config";

const DOOR_ICONS: Record<WelcomeDoorItemConfig["id"], LucideIcon> = {
  play: Play,
  build: Hammer,
  learn: BookOpen,
};

/**
 * The second screen (Phase 1.3): three doors instead of a dense page.
 *
 * Play and Build carry almost all the intent, so they get two large cards.
 * Learn is a smaller row underneath, not an equal third column — three
 * identical blocks imply an even traffic split that isn't real and read as
 * machine-made. Play = ready-made drills, Build = the Workshop, Learn =
 * articles. Copy lives in `lib/welcome-config.ts` so `/dev/welcome-lab` can
 * tune it.
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
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            {doors.eyebrow}
          </span>
          <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {doors.title}
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {primary.map((door) => {
            const Icon = DOOR_ICONS[door.id] ?? Play;
            return (
              <Link
                key={door.id}
                href={door.href}
                data-testid={`door-${door.id}`}
                data-emphasis="primary"
                className="group flex flex-col rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-heading text-xl font-semibold tracking-tight text-foreground">
                  {door.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {door.description}
                </p>
              </Link>
            );
          })}
        </div>

        {secondary.map((door) => {
          const Icon = DOOR_ICONS[door.id] ?? BookOpen;
          return (
            <Link
              key={door.id}
              href={door.href}
              data-testid={`door-${door.id}`}
              data-emphasis="secondary"
              className="group mt-4 flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-5 py-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-heading text-sm font-semibold text-foreground">
                  {door.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {door.description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
