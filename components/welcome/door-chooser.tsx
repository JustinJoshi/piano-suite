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
 * Play = guided routes + ready-made drills, Build = the Workshop, Learn =
 * articles. Copy lives in `lib/welcome-config.ts` so `/dev/welcome-lab`
 * can tune it.
 */
export function DoorChooser() {
  const { config } = useWelcomeConfig();
  const { doors } = config;

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            {doors.eyebrow}
          </span>
          <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {doors.title}
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {doors.items.map((door) => {
            const Icon = DOOR_ICONS[door.id] ?? Play;
            return (
              <Link
                key={door.id}
                href={door.href}
                data-testid={`door-${door.id}`}
                className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight text-foreground">
                  {door.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {door.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
