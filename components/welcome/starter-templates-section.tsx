import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { starterTemplates } from "@/lib/starter-templates";
import { SectionHeading } from "./section-heading";

export function StarterTemplatesSection() {
  const { config } = useWelcomeConfig();
  const { eyebrow, title, subtitle, browseHref } = config.templateStrip;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
          <Link
            href={browseHref}
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary"
          >
            Browse community drills
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {starterTemplates.slice(0, 4).map((template, index) => {
            const Icon = template.icon;
            return (
              <Link
                key={template.id}
                href="/tools/workshop"
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-surface transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-raised"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-door-play/12 text-door-play ring-1 ring-door-play/25">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold tracking-tight text-foreground">
                  {template.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {template.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary opacity-80 transition-opacity group-hover:opacity-100">
                  Open in Workshop
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
