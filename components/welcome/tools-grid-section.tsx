import Link from "next/link";
import { Wrench, Play } from "lucide-react";
import { ToolCard } from "@/components/tools/tool-card";
import { drillTools, insightTools, labTools } from "@/lib/tools";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ToolsGridSection() {
  const { config } = useWelcomeConfig();
  const { eyebrow, title, subtitle } = config.toolsGrid;

  const otherTools = [...drillTools, ...insightTools, ...labTools];

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/tools/workshop" className="group mb-10 block">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 transition-colors hover:border-primary/40 hover:bg-primary/10 sm:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    Workshop
                  </h3>
                  <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
                    Build your own practice page from reusable blocks —
                    metronome, timer, chord sets, and more. Or grab a starter
                    template and press Start.
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "shrink-0 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Play className="mr-2 h-4 w-4 fill-current" />
                Open the Workshop
              </div>
            </div>
          </div>
        </Link>

        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            {eyebrow}
          </span>
          <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {otherTools.map((tool) => (
            <ToolCard
              key={tool.href}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              href={tool.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
