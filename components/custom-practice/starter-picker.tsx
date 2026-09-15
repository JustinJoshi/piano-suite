"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, Hammer, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { starterTemplates, type StarterTemplate } from "@/lib/starter-templates";
import { RouteCards } from "@/components/routes/route-cards";
import { cn } from "@/lib/utils";

type StarterPickerProps = {
  onSelect: (template: StarterTemplate) => void;
  onDismiss: () => void;
  canClose?: boolean;
};

const categoryLabels = {
  "getting-started": "Start here",
  chords: "Chord practice",
  rhythm: "Rhythm",
  technique: "Technique",
} as const;

export function StarterPicker({ onSelect, onDismiss, canClose = true }: StarterPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function choose(template: StarterTemplate) {
    setSelectedId(template.id);
    onSelect(template);
  }

  return (
    <Card className="relative overflow-hidden border-primary/30 bg-card shadow-raised">
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-40 opacity-50" />
      <CardHeader className="relative flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Your Workshop</p>
          <CardTitle className="mt-2 text-3xl">How do you want to start?</CardTitle>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            New to the piano? Follow a guided route, pick a ready-made
            practice page, or start from scratch — every block stays
            editable.
          </p>
        </div>
        {canClose ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close template picker"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </CardHeader>
      <CardContent className="relative space-y-6">
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-door-learn">
            <span className="h-1.5 w-1.5 rounded-full bg-door-learn" />
            Guided routes
          </h3>
          <RouteCards />
        </section>

        {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((category) => {
          const templates = starterTemplates.filter((template) => template.category === category);
          return (
            <section key={category}>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-door-play" />
                {categoryLabels[category]}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => choose(template)}
                      className={cn(
                        "group flex items-start gap-3 rounded-xl border border-border bg-elevated/60 p-3 text-left shadow-surface transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5",
                        selectedId === template.id && "border-primary bg-primary/10"
                      )}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-door-play/12 text-door-play ring-1 ring-door-play/25">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">{template.title}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{template.description}</span>
                      </span>
                      <ArrowRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
          <button type="button" onClick={onDismiss} className="key-press inline-flex items-center justify-center gap-2 rounded-lg bg-action px-3.5 py-2 text-sm font-medium text-action-foreground shadow-key hover:bg-action-hover">
            <Hammer className="h-4 w-4" />
            Start from scratch
          </button>
          <Link href="/routes" onClick={onDismiss} className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10">
            <Compass className="h-4 w-4" />
            Follow a guided route
          </Link>
          <Link href="/marketplace" onClick={onDismiss} className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10">
            <Compass className="h-4 w-4" />
            Browse community drills
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
