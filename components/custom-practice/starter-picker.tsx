"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, Hammer, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { starterTemplates, type StarterTemplate } from "@/lib/starter-templates";
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
    <Card className="border-primary/30 bg-card shadow-lg">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Your Workshop</p>
          <CardTitle className="mt-2 text-2xl">How do you want to start?</CardTitle>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Pick a ready-made practice page and start playing, or make a page from scratch.
            You can change every block later.
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
      <CardContent className="space-y-5">
        {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((category) => {
          const templates = starterTemplates.filter((template) => template.category === category);
          return (
            <section key={category}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                        "group flex items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5",
                        selectedId === template.id && "border-primary bg-primary/10"
                      )}
                    >
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
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
          <button type="button" onClick={onDismiss} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
            <Hammer className="h-4 w-4" />
            Start from scratch
          </button>
          <Link href="/workshop" onClick={onDismiss} className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10">
            <Compass className="h-4 w-4" />
            Browse community drills
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
