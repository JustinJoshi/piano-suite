import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageThumbnail } from "@/components/workshop-grid/page-thumbnail";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { starterTemplates } from "@/lib/starter-templates";
import { SectionHeading } from "./section-heading";

/**
 * Four starter pages, each shown as what it actually is: a miniature of
 * its Workshop grid (the drilled block tinted in the Play hue), then the
 * title and a one-line promise. The index numbers are set in the mono cut
 * like catalogue numbers in a programme.
 */
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
            className="group inline-flex shrink-0 items-center gap-2 rounded-md text-sm font-semibold text-primary"
          >
            Browse community drills
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {starterTemplates.slice(0, 4).map((template, index) => (
            <li key={template.id} className="flex">
              <Link
                href="/tools/workshop"
                className="group relative flex w-full flex-col rounded-2xl border border-border bg-card p-4 shadow-surface transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 motion-reduce:hover:translate-y-0"
              >
                <PageThumbnail
                  blocks={template.blocks}
                  className="transition-colors duration-200 group-hover:border-primary/25"
                />
                <div className="mt-4 flex items-baseline justify-between gap-3 px-1">
                  <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                    {template.title}
                  </h3>
                  <span className="font-mono text-[0.68rem] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-1.5 flex-1 px-1 text-sm leading-relaxed text-muted-foreground">
                  {template.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-primary opacity-85 transition-opacity group-hover:opacity-100">
                  Open in Workshop
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
