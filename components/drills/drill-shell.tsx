import { cn } from "@/lib/utils";

export type DrillShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
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
  "data-testid": dataTestId,
}: DrillShellProps) {
  return (
    <div
      className={cn("flex min-h-full flex-col", className)}
      data-testid={dataTestId ?? "drill-shell"}
    >
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-background/95 px-6 backdrop-blur">
        <div>
          <h1 className="font-heading text-lg font-semibold text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        {right ? (
          <div className="flex items-center gap-3">{right}</div>
        ) : null}
      </header>

      <div className="flex min-h-full flex-1 flex-col p-6 lg:p-8">
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
