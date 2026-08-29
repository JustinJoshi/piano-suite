import { cn } from "@/lib/utils";
import { DashboardMenuButton } from "@/components/tools/dashboard-nav";

export type DrillShellProps = {
  title: string;
  subtitle?: string;
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
 * Provides the sticky header, title/subtitle block, optional right-side
 * actions, and a consistent scrollable content area.
 */
export function DrillShell({
  title,
  subtitle,
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
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <DashboardMenuButton />
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-semibold text-foreground">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>

        {right ? (
          <div className="flex shrink-0 items-center gap-3">{right}</div>
        ) : null}
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
