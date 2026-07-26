import { ArrowRight } from "lucide-react";

const steps = [
  { id: "anki", label: "anki", text: "Your due card names a chord" },
  { id: "drill", label: "drill", text: "The drill loads that chord" },
  { id: "midi", label: "midi", text: "You play it, timed, on real keys" },
  { id: "anki-2", label: "anki", text: "The card flips so you can grade it" },
];

export function FlowSection() {
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3">
            <div className="flex flex-col items-center rounded-xl border border-border bg-muted px-4 py-3 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                {step.label}
              </span>
              <span className="mt-1 text-sm text-foreground">{step.text}</span>
            </div>
            {index < steps.length - 1 && (
              <ArrowRight className="hidden h-4 w-4 text-primary sm:block" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
