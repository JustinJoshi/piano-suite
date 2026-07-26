import { cn } from "@/lib/utils";

interface FeatureSectionProps {
  number: string;
  label: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function FeatureSection({
  number,
  label,
  title,
  children,
  className,
}: FeatureSectionProps) {
  return (
    <section className={cn("py-16 sm:py-20", className)}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {number}
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              {label}
            </span>
          </div>
          <h2 className="mb-4 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
