import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToolCardTone = "brand" | "play" | "explore" | "learn";

const toneClasses: Record<ToolCardTone, string> = {
  brand: "bg-primary/12 text-primary ring-primary/25",
  play: "bg-door-play/12 text-door-play ring-door-play/25",
  explore: "bg-door-explore/12 text-door-explore ring-door-explore/25",
  learn: "bg-door-learn/12 text-door-learn ring-door-learn/25",
};

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  /** Which door the tool belongs to; drives the icon chip hue. */
  tone?: ToolCardTone;
  className?: string;
}

/**
 * Compact tool row: hue-tinted icon chip, title, one-line description, and
 * an arrow that wakes up on hover. Used by the landing grid and any list of
 * registry tools.
 */
export function ToolCard({
  title,
  description,
  icon: Icon,
  href,
  tone = "brand",
  className,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-surface transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        className
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
          toneClasses[tone]
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span
            data-testid="tool-card-title"
            className="font-heading text-base font-semibold tracking-tight text-foreground"
          >
            {title}
          </span>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </Link>
  );
}
