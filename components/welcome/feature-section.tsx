import { cn } from "@/lib/utils";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

interface FeatureSectionProps {
  id: string;
  children?: React.ReactNode;
  className?: string;
  /**
   * `inverse` flips the stage (ivory on dark themes, ebony on Ivory) so one
   * section in the scroll acts as visual punctuation.
   */
  tone?: "default" | "inverse";
  /** Draw the five-line staff texture behind the section. */
  staff?: boolean;
}

const densityClasses = {
  compact: {
    section: "py-12 sm:py-16",
    title: "text-2xl sm:text-3xl",
    body: "text-sm sm:text-base",
  },
  default: {
    section: "py-16 sm:py-24",
    title: "text-3xl sm:text-4xl",
    body: "text-base sm:text-lg",
  },
  spacious: {
    section: "py-24 sm:py-32",
    title: "text-4xl sm:text-5xl",
    body: "text-lg",
  },
};

const cardStyleClasses = {
  filled: "border border-border bg-card shadow-surface",
  transparent: "",
  gradient:
    "border border-border bg-gradient-to-br from-card/90 to-card/40 shadow-surface",
};

const radiusClasses = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  "2xl": "rounded-[2rem]",
};

/**
 * One landing "measure": the number and label sit in a left column that
 * stays put while the copy scrolls on wide screens, so the four sections
 * read as movements of one piece instead of four identical cards.
 */
export function FeatureSection({
  id,
  children,
  className,
  tone = "default",
  staff = false,
}: FeatureSectionProps) {
  const { config } = useWelcomeConfig();
  const section = config.features.sections.find((s) => s.id === id);
  if (!section) return null;

  const density = densityClasses[config.features.density];
  const cardStyle = cardStyleClasses[config.features.cardStyle];
  const radius = radiusClasses[config.styleTokens.cardRadius];
  const isCard = config.features.cardStyle !== "transparent";

  return (
    <section
      className={cn(
        "relative",
        density.section,
        tone === "inverse" && "tone-inverse grain",
        className
      )}
    >
      {staff ? (
        <div
          aria-hidden
          className="staff-lines staff-lines-faded pointer-events-none absolute inset-0"
        />
      ) : null}

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid gap-8 md:grid-cols-[minmax(0,14rem)_1fr] md:gap-14",
            isCard && cn("p-6 sm:p-10", cardStyle, radius)
          )}
        >
          <div className="relative md:sticky md:top-28 md:self-start">
            <span className="measure-number block text-8xl sm:text-9xl">
              {section.number}
            </span>
            <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {section.label}
            </span>
          </div>

          <div>
            <h2
              className={cn(
                "font-heading font-semibold tracking-tight text-foreground",
                density.title
              )}
            >
              {section.title}
            </h2>
            <div
              className={cn(
                "mt-6 space-y-5 leading-relaxed text-muted-foreground",
                density.body
              )}
            >
              {section.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {section.tags && section.tags.length > 0 ? (
              <div className="mt-7 flex flex-wrap gap-2">
                {section.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border bg-muted/70 px-3 py-1 text-xs font-medium text-foreground/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
