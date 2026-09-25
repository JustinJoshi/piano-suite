import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The roll's primary call to action: an ink key with a stub, a perforated
 * tear line that lights up like a glissando on hover, and the label.
 */
export function RollTicket({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("roll-btn roll-btn-ink roll-btn-lg roll-ticket", className)}>
      <span className="roll-ticket-stub" aria-hidden="true">
        <svg viewBox="0 0 12 12" width="11" height="11">
          <path d="M2.5 1.5v9l8-4.5z" fill="currentColor" />
        </svg>
      </span>
      <span className="roll-ticket-perf" aria-hidden="true">
        {Array.from({ length: 7 }, (_, n) => (
          <i key={n} style={{ "--n": n } as CSSProperties} />
        ))}
      </span>
      <span>{children}</span>
    </Link>
  );
}

export function RollArrow() {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path d="M4 10h11M11 5.5 15.5 10 11 14.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
