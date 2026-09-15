import { cn } from "@/lib/utils";

/**
 * Consistent heading block for `/settings/*` pages: display title, one
 * sentence of context, optional right-side actions.
 */
export function SettingsPageHeader({
  title,
  description,
  eyebrow = "Settings",
  actions,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </span>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
