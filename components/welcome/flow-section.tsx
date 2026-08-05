import { ArrowDown, ArrowRight } from "lucide-react";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { cn } from "@/lib/utils";

export function FlowSection() {
  const { config } = useWelcomeConfig();
  const { steps, layout } = config.flow;

  const isVertical = layout === "vertical";

  return (
    <div className="mt-8">
      <div
        className={cn(
          "flex items-center gap-3",
          isVertical ? "flex-col" : "flex-col sm:flex-row sm:flex-wrap sm:justify-center"
        )}
      >
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3",
              isVertical ? "flex-col" : "flex-col sm:flex-row"
            )}
          >
            <div
              className={cn(
                "flex flex-col items-center rounded-xl border border-border bg-muted px-4 py-3 text-center",
                isVertical ? "w-full max-w-xs" : "w-full max-w-xs sm:w-auto sm:max-w-[10rem]"
              )}
            >
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {step.label}
              </span>
              <span className="mt-1 text-sm text-foreground">{step.text}</span>
            </div>
            {index < steps.length - 1 ? (
              isVertical ? (
                <ArrowDown className="h-4 w-4 text-primary" />
              ) : (
                <>
                  <ArrowDown className="h-4 w-4 text-primary sm:hidden" />
                  <ArrowRight className="hidden h-4 w-4 text-primary sm:block" />
                </>
              )
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
