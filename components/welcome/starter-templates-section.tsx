import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { starterTemplates } from "@/lib/starter-templates";

export function StarterTemplatesSection() {
  const { config } = useWelcomeConfig();
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">{config.templateStrip.eyebrow}</span>
            <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{config.templateStrip.title}</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">{config.templateStrip.subtitle}</p>
          </div>
          <Link href={config.templateStrip.browseHref} className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary hover:underline">
            Browse community drills <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {starterTemplates.slice(0, 4).map((template) => {
            const Icon = template.icon;
            return (
              <Link
              key={template.id}
              href={`/tools/workshop?template=${template.id}`}
              className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 text-sm font-semibold text-foreground">{template.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{template.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
