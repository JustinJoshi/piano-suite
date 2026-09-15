import Link from "next/link";
import { Wrench, Play } from "lucide-react";
import { Keybed } from "@/components/brand/keybed";
import { ToolCard, type ToolCardTone } from "@/components/tools/tool-card";
import { drillTools, insightTools, labTools, type ToolDef } from "@/lib/tools";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

const groups: Array<{
  label: string;
  tone: ToolCardTone;
  tools: ToolDef[];
}> = [
  { label: "Ready-made drills", tone: "play", tools: drillTools },
  { label: "Progress", tone: "learn", tools: insightTools },
  { label: "Visual labs", tone: "explore", tools: labTools },
];

export function ToolsGridSection() {
  const { config } = useWelcomeConfig();
  const { eyebrow, title, subtitle } = config.toolsGrid;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Workshop marquee */}
        <Link
          href="/tools/workshop"
          className="group relative mb-16 block overflow-hidden rounded-3xl border border-primary/25 bg-card shadow-raised transition-colors hover:border-primary/50"
        >
          <div className="hero-glow absolute inset-0 opacity-60" aria-hidden />
          <div className="staff-lines staff-lines-faded absolute inset-0" aria-hidden />
          <div className="relative flex flex-col gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10">
            <div className="flex items-start gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-key">
                <Wrench className="h-6 w-6" />
              </span>
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  the core
                </span>
                <h3 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Workshop
                </h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Build your own practice page from reusable blocks — metronome,
                  timer, chord sets, and more. Or grab a starter template and
                  press Start.
                </p>
              </div>
            </div>
            <span
              className={cn(
                buttonVariants({ size: "lg" }),
                "shrink-0 rounded-full px-6"
              )}
            >
              <Play className="h-4 w-4 fill-current" />
              Open the Workshop
            </span>
          </div>
          <Keybed
            octaves={7}
            lit={[0, 4, 7, 12 + 2, 12 + 5, 12 + 9, 24 + 4, 24 + 7, 24 + 11]}
            className="relative h-8 w-full opacity-90 sm:h-10"
          />
        </Link>

        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          align="center"
        />

        <div className="mt-12 space-y-12">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    group.tone === "play" && "bg-door-play",
                    group.tone === "learn" && "bg-door-learn",
                    group.tone === "explore" && "bg-door-explore"
                  )}
                />
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {group.label}
                </h3>
                <span className="bar-line flex-1" aria-hidden />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.tools.map((tool) => (
                  <ToolCard
                    key={tool.href}
                    title={tool.title}
                    description={tool.description}
                    icon={tool.icon}
                    href={tool.href}
                    tone={group.tone}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
