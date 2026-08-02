import { ToolCard } from "@/components/tools/tool-card";
import { tools } from "@/lib/tools";

export function ToolsGridSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            the toolkit
          </span>
          <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Twelve tools, one practice routine
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Drills for your hands, labs for your eyes, and tracking for your progress — all built to live inside an Anki routine.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
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
