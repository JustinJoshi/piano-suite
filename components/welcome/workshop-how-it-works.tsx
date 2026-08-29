import { ArrowRight } from "lucide-react";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

export function WorkshopHowItWorks() {
  const { config } = useWelcomeConfig();
  return (
    <section className="border-y border-border/50 bg-card/60 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">{config.howItWorks.eyebrow}</span>
          <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{config.howItWorks.title}</h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-3 md:grid-cols-3">
          {config.howItWorks.steps.map((step, index) => (
            <div key={step.id} className="relative rounded-2xl border border-primary/20 bg-background/70 p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">{step.label}</span>
              <p className="mt-3 text-sm leading-relaxed text-foreground">{step.text}</p>
              {index < config.howItWorks.steps.length - 1 ? <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-primary md:block" /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
