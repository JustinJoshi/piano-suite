import { cn } from "@/lib/utils";

/**
 * Eyebrow + display title (+ optional subtitle) used by every landing
 * section so the rhythm stays identical from top to bottom.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  number,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  /** Optional measure number rendered large and faint behind the eyebrow. */
  number?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative",
        align === "center" && "mx-auto max-w-2xl text-center",
        className
      )}
    >
      {number ? (
        <span
          aria-hidden
          className={cn(
            "measure-number pointer-events-none absolute -top-8 text-7xl sm:-top-12 sm:text-8xl",
            align === "center" ? "left-1/2 -translate-x-1/2" : "-left-2"
          )}
        >
          {number}
        </span>
      ) : null}
      {eyebrow ? (
        <span className="relative text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="relative mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            "relative mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg",
            align === "center" && "mx-auto"
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
