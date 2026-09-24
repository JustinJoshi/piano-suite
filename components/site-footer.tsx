import Link from "next/link";
import { AppliedLogoMark } from "@/components/brand/applied-logo-mark";
import { KeybedStrip } from "@/components/brand/keybed-strip";
import { cn } from "@/lib/utils";

type FooterLink = { label: string; href: string };

const footerColumns: Array<{ heading: string; links: FooterLink[] }> = [
  {
    heading: "Practice",
    links: [
      { label: "Workshop", href: "/tools/workshop" },
      { label: "Guided routes", href: "/routes" },
      { label: "Start here", href: "/start" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Articles", href: "/articles" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
];

const legalLinks: FooterLink[] = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

const linkClass =
  "rounded-sm text-muted-foreground transition-colors duration-150 hover:text-foreground";

/**
 * Shared public footer. A proportional keybed runs along the top edge so
 * every marketing page ends on the same instrument, and the last line ends
 * the way a score does — a final double bar and *Fine*.
 *
 * Terms and Privacy stay in the footer because the go-live e2e spec counts
 * exactly one of each on `/pricing`.
 */
export function SiteFooter({
  className,
  compact = false,
}: {
  className?: string;
  /** Hide the link columns (pages that already list those links). */
  compact?: boolean;
}) {
  return (
    <footer className={cn("relative mt-auto", className)}>
      <KeybedStrip keyWidth={17} className="h-6 sm:h-7" />
      <div className="border-t border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "grid gap-10 py-12",
              compact
                ? "sm:grid-cols-[1fr_auto] sm:items-center sm:py-10"
                : "sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]"
            )}
          >
            <div className="max-w-xs">
              <Link
                href="/"
                className="group inline-flex items-center gap-2.5 rounded-md"
                aria-label="Piano Suite home"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/18">
                  <AppliedLogoMark className="h-5 w-5" title="Piano Suite" />
                </span>
                <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
                  Piano Suite
                </span>
              </Link>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                A free, friendly home for self-taught pianists.
              </p>
              {!compact ? (
                <p className="mt-1 font-heading text-sm italic text-muted-foreground/80">
                  A little, most days, is plenty.
                </p>
              ) : null}
            </div>

            {!compact
              ? footerColumns.map((column) => (
                  <nav
                    key={column.heading}
                    aria-label={column.heading}
                    className="text-sm"
                  >
                    <h2 className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                      {column.heading}
                    </h2>
                    <ul className="mt-4 space-y-2.5">
                      {column.links.map((link) => (
                        <li key={link.href}>
                          <Link href={link.href} className={linkClass}>
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))
              : null}

            {compact ? (
              <nav
                aria-label="Legal"
                className="flex items-center gap-5 text-sm"
              >
                {legalLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                ))}
              </nav>
            ) : null}
          </div>

          {/* Colophon: the last bar of the page. */}
          <div className="flex flex-col gap-4 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Made for everyone teaching themselves piano. Free to learn with,
              always.
            </p>
            <div className="flex items-center gap-5">
              {!compact ? (
                <nav aria-label="Legal" className="flex items-center gap-5">
                  {legalLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={linkClass}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              ) : null}
              <span
                aria-hidden
                className="flex items-center gap-2 text-foreground/60"
              >
                <span className="font-heading text-sm italic">Fine</span>
                <span className="final-barline h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
