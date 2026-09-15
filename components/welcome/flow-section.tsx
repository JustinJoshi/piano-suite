import { ArrowDown, ArrowRight } from "lucide-react";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { cn } from "@/lib/utils";

/**
 * The pick → build → play → share loop, drawn as a chord progression:
 * four raised "keys" joined by arrows, stacking vertically on small screens.
 */
export function FlowSection() {
  const { config } = useWelcomeConfig();
  const { steps, layout } = config.flow;

  const isVertical = layout === "vertical";

  return (
    <div className="mt-10">
      <ol
        className={cn(
          "flex items-stretch gap-3",
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
              isVertical ? "flex-col" : "flex-col sm:flex-row lg:min-w-0 lg:flex-1"
            )}
          >
            <div
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border border-border bg-elevated px-4 py-3 text-center shadow-surface",
                isVertical
                  ? "w-full max-w-xs"
                  : "w-full max-w-xs sm:w-auto sm:max-w-[11rem] lg:min-w-0 lg:flex-1 lg:max-w-none"
              )}
            >
              <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
                {step.label}
              </span>
              <span className="mt-1.5 text-sm leading-snug text-foreground">
                {step.text}
              </span>
            </div>
            {index < steps.length - 1 ? (
              isVertical ? (
                <ArrowDown className="h-4 w-4 text-primary/70" />
              ) : (
                <>
                  <ArrowDown className="h-4 w-4 text-primary/70 sm:hidden" />
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-primary/70 sm:block" />
                </>
              )
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
