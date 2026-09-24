import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";

/** Staff geometry in px: five lines, 12px apart; the top line sits at STAFF_TOP. */
const STAFF_TOP = 30;
const STAFF_GAP = 12;

/**
 * A rising C-major arpeggio, one note per step — C4 (on a ledger line),
 * E4 (bottom line), G4 (second line) — so the three steps read as a phrase
 * that climbs. Offsets are staff positions below the top line, in half-gaps.
 */
const ARPEGGIO: Array<{ name: string; halfStepsBelowTop: number; ledger: boolean }> = [
  { name: "C", halfStepsBelowTop: 10, ledger: true },
  { name: "E", halfStepsBelowTop: 8, ledger: false },
  { name: "G", halfStepsBelowTop: 6, ledger: false },
];

function Note({ index }: { index: number }) {
  const pitch = ARPEGGIO[index % ARPEGGIO.length];
  const y = STAFF_TOP + (pitch.halfStepsBelowTop * STAFF_GAP) / 2;
  const x = 30;
  return (
    <svg
      aria-hidden
      viewBox="0 0 60 110"
      className="absolute left-1/2 top-0 h-[110px] w-[60px] -translate-x-1/2 overflow-visible"
    >
      {pitch.ledger ? (
        <line
          x1={x - 13}
          x2={x + 13}
          y1={y}
          y2={y}
          stroke="var(--color-foreground)"
          strokeOpacity={0.55}
          strokeWidth={1.25}
        />
      ) : null}
      <g className="origin-center transition-transform duration-300 ease-key [transform-box:fill-box] group-hover:scale-110 motion-reduce:transition-none">
        {/* Stem up from the right of the head, three and a half spaces long. */}
        <line
          x1={x + 6.6}
          x2={x + 6.6}
          y1={y - 1.5}
          y2={y - STAFF_GAP * 3.5}
          stroke="var(--color-primary)"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <ellipse
          cx={x}
          cy={y}
          rx={7.4}
          ry={5.3}
          transform={`rotate(-22 ${x} ${y})`}
          fill="var(--color-primary)"
          className="transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_6px_var(--primary-glow))]"
        />
      </g>
    </svg>
  );
}

/**
 * Three steps written as one bar of music. A real staff runs behind the
 * row with a bar line at each measure; each step is a quarter note in a
 * rising C–E–G arpeggio, with its measure number engraved above the staff
 * the way a score numbers bars, and the phrase ends on a final double bar.
 * On phones the measures stack, each with its own short stave.
 */
export function WorkshopHowItWorks() {
  const { config } = useWelcomeConfig();
  const { eyebrow, title, steps } = config.howItWorks;

  return (
    <section className="relative border-y border-border bg-card/60 py-16 backdrop-blur-sm sm:py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={eyebrow} title={title} align="center" />

        <ol className="relative mx-auto mt-12 grid max-w-5xl gap-10 md:mt-16 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => {
            const measure = Number.parseInt(step.label, 10) || index + 1;
            const last = index === steps.length - 1;
            return (
              <li key={step.id} className="group relative flex flex-col items-center text-center">
                <div aria-hidden className="relative h-[110px] w-full">
                  {/* The stave; on wide screens it bleeds into the gutters so
                      the three measures join into one continuous line. */}
                  <div
                    className={cn(
                      "staff-stave absolute inset-x-0",
                      index > 0 && "md:-left-4",
                      !last && "md:-right-4"
                    )}
                    style={{ top: STAFF_TOP, height: STAFF_GAP * 4 + 1 }}
                  />
                  {/* Bar line opening this measure. */}
                  <span
                    className={cn(
                      "absolute w-px bg-foreground/45",
                      index === 0 ? "left-0" : "left-0 md:-left-4"
                    )}
                    style={{ top: STAFF_TOP, height: STAFF_GAP * 4 + 1 }}
                  />
                  {last ? (
                    <span
                      className="final-barline absolute right-0 text-foreground/70"
                      style={{ top: STAFF_TOP, height: STAFF_GAP * 4 + 1 }}
                    />
                  ) : (
                    <span
                      className="absolute right-0 w-px bg-foreground/45 md:hidden"
                      style={{ top: STAFF_TOP, height: STAFF_GAP * 4 + 1 }}
                    />
                  )}
                  {/* Measure number, engraved small and italic above the bar line. */}
                  <span
                    className={cn(
                      "absolute font-heading text-sm italic text-muted-foreground",
                      index === 0 ? "left-0" : "left-0 md:-left-4"
                    )}
                    style={{ top: STAFF_TOP - 26 }}
                  >
                    {measure}
                  </span>
                  <Note index={index} />
                </div>
                <p className="mt-2 max-w-xs text-base leading-relaxed text-foreground sm:text-[1.05rem]">
                  {step.text}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
