import { cn } from "@/lib/utils";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

interface FeatureSectionProps {
  id: string;
  children?: React.ReactNode;
  className?: string;
}

const densityClasses = {
  compact: {
    section: "py-10 sm:py-12",
    card: "p-5 sm:p-6",
    title: "text-xl sm:text-2xl",
    body: "text-sm sm:text-base",
  },
  default: {
    section: "py-16 sm:py-20",
    card: "p-6 sm:p-10",
    title: "text-2xl sm:text-3xl",
    body: "text-base",
  },
  spacious: {
    section: "py-20 sm:py-28",
    card: "p-8 sm:p-12",
    title: "text-3xl sm:text-4xl",
    body: "text-lg",
  },
};

const cardStyleClasses = {
  filled: "bg-card",
  transparent: "bg-transparent border-transparent",
  gradient: "bg-gradient-to-br from-card/80 to-card/40",
};

const radiusClasses = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  "2xl": "rounded-[2rem]",
};

export function FeatureSection({
  id,
  children,
  className,
}: FeatureSectionProps) {
  const { config } = useWelcomeConfig();
  const section = config.features.sections.find((s) => s.id === id);
  if (!section) return null;

  const density = densityClasses[config.features.density];
  const cardStyle = cardStyleClasses[config.features.cardStyle];
  const radius = radiusClasses[config.styleTokens.cardRadius];

  return (
    <section className={cn(density.section, className)}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "border border-border transition-colors",
            density.card,
            cardStyle,
            radius
          )}
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {section.number}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              {section.label}
            </span>
          </div>
          <h2
            className={cn(
              "mb-4 font-heading font-semibold tracking-tight text-foreground",
              density.title
            )}
          >
            {section.title}
          </h2>
          <div
            className={cn(
              "space-y-4 leading-relaxed text-muted-foreground",
              density.body
            )}
          >
            {section.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {section.tags && section.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {section.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {children}
        </div>
      </div>
    </section>
  );
}
