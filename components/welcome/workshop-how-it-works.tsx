import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { SectionHeading } from "./section-heading";

/**
 * Three steps laid out like measures on a staff: a bar line runs behind
 * the row, each step carries its measure number, and the copy sits on a
 * raised surface so the sequence reads left to right.
 */
export function WorkshopHowItWorks() {
  const { config } = useWelcomeConfig();
  const { eyebrow, title, steps } = config.howItWorks;

  return (
    <section className="relative border-y border-border bg-card/60 py-16 backdrop-blur-sm sm:py-24">
      <div className="staff-lines staff-lines-faded pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={eyebrow} title={title} align="center" />

        <ol className="relative mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3 md:gap-8">
          {/* Bar line connecting the measures on wide screens */}
          <div
            aria-hidden
            className="bar-line absolute inset-x-8 top-7 hidden md:block"
          />
          {steps.map((step) => (
            <li key={step.id} className="relative flex flex-col items-center text-center">
              <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-background font-heading text-lg font-semibold text-primary shadow-[0_0_18px_-4px_var(--primary-glow)]">
                {step.label}
              </span>
              <div className="mt-5 w-full rounded-2xl border border-border bg-elevated p-5 shadow-surface">
                <p className="text-base leading-relaxed text-foreground">
                  {step.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
