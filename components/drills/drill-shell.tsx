import { cn } from "@/lib/utils";
import { DashboardMenuButton } from "@/components/tools/dashboard-nav";

export type DrillShellProps = {
  title: string;
  subtitle?: string;
  /** Optional small pill rendered next to the title (e.g. "Beta"). */
  badge?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  /** Drop the centered max-width so the content spans the full page. */
  wide?: boolean;
  "data-testid"?: string;
};

/**
 * Shared layout wrapper for every practice tool page.
 *
 * Provides the sticky glass header with a lit brand rule underneath, the
 * title/subtitle block, optional right-side actions, and a consistent
 * scrollable content area.
 */
export function DrillShell({
  title,
  subtitle,
  badge,
  children,
  right,
  className,
  wide = false,
  "data-testid": dataTestId,
}: DrillShellProps) {
  return (
    <div
      className={cn("flex min-h-full flex-col", className)}
      data-testid={dataTestId ?? "drill-shell"}
    >
      <header className="glass sticky top-0 z-30 border-b border-border">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <DashboardMenuButton />
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight text-foreground">
                <span className="truncate">{title}</span>
                {badge ? (
                  <span className="shrink-0 rounded-full border border-accent/40 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                    {badge}
                  </span>
                ) : null}
              </h1>
              {subtitle ? (
                <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </div>

          {right ? (
            <div className="flex shrink-0 items-center gap-3">{right}</div>
          ) : null}
        </div>
        <div aria-hidden className="bar-line" />
      </header>

      <div className="flex min-h-full flex-1 flex-col p-4 sm:p-6 lg:p-8">
        <div
          className={cn(
            "flex min-h-full w-full flex-col",
            !wide && "mx-auto max-w-6xl"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
