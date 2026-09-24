import { ArrowDown, ArrowRight } from "lucide-react";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { cn } from "@/lib/utils";

/**
 * The pick → build → play → share loop, drawn as a chord progression:
 * four raised keys of equal height joined by arrows, stacking vertically on
 * small screens. Each key carries its step number in the corner, like the
 * fingering numbers printed over notes.
 */
export function FlowSection() {
  const { config } = useWelcomeConfig();
  const { steps, layout } = config.flow;

  const isVertical = layout === "vertical";

  return (
    <div className="mt-10">
      <ol
        className={cn(
          "flex gap-3",
          isVertical
            ? "flex-col items-center"
            : "flex-col items-center sm:flex-row sm:flex-wrap sm:items-stretch lg:flex-nowrap"
        )}
      >
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "flex items-center gap-3",
              isVertical
                ? "w-full max-w-xs flex-col"
                : "w-full max-w-xs flex-col sm:w-auto sm:max-w-none sm:flex-row lg:min-w-0 lg:flex-1"
            )}
          >
            <div
              className={cn(
                "relative flex w-full flex-col items-center justify-start self-stretch rounded-xl border border-border bg-elevated px-4 pb-4 pt-3.5 text-center shadow-surface transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 motion-reduce:hover:translate-y-0",
                !isVertical && "sm:w-[11rem] lg:w-auto lg:min-w-0 lg:flex-1"
              )}
            >
              <span
                aria-hidden
                className="absolute right-2.5 top-2 font-heading text-[0.7rem] italic text-muted-foreground/70"
              >
                {index + 1}
              </span>
              <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
                {step.label}
              </span>
              <span className="mt-1.5 text-sm leading-snug text-foreground">
                {step.text}
              </span>
            </div>
            {index < steps.length - 1 ? (
              isVertical ? (
                <ArrowDown aria-hidden className="h-4 w-4 shrink-0 text-primary/70" />
              ) : (
                <>
                  <ArrowDown aria-hidden className="h-4 w-4 shrink-0 text-primary/70 sm:hidden" />
                  <ArrowRight aria-hidden className="hidden h-4 w-4 shrink-0 text-primary/70 sm:block" />
                </>
              )
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
