import Link from "next/link";
import { cn } from "@/lib/utils";

type FooterLink = { label: string; href: string };

const footerColumns: Array<{ heading: string; links: FooterLink[] }> = [
  {
    heading: "Practice",
    links: [
      { label: "Start playing", href: "/start" },
      { label: "The Workshop", href: "/tools/workshop" },
      { label: "Guided routes", href: "/routes" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Publish a page", href: "/sign-up" },
    ],
  },
  {
    heading: "Reading",
    links: [{ label: "Articles", href: "/articles" }],
  },
  {
    heading: "Account",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Sign up", href: "/sign-up" },
      { label: "Pricing and waitlist", href: "/pricing" },
    ],
  },
];

const legalLinks: FooterLink[] = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

/**
 * The key slip: the shared public footer. Dark wood with a strip of red felt
 * along its top edge, as on the piano, under the end of the roll.
 *
 * Terms and Privacy appear exactly once each — the go-live e2e spec counts
 * them on `/pricing`.
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
    <footer className={cn("tone-roll roll-keyslip roll-on-case", compact && "roll-keyslip-compact", className)}>
      <div className="roll-felt" aria-hidden="true" />
      <div className="roll-sheet roll-keyslip-inner">
        <div className="roll-keyslip-brand">
          <Link href="/" className="roll-wordmark" aria-label="Piano Suite home">
            <span className="roll-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>Piano Suite</span>
          </Link>
          {!compact ? (
            <p>A workshop for building your own piano practice. Free, in your browser.</p>
          ) : null}
        </div>

        {!compact ? (
          <nav aria-label="Footer" className="roll-keyslip-nav">
            {footerColumns.map((column) => (
              <div key={column.heading}>
                <h2 className="roll-label">{column.heading}</h2>
                <ul>
                  {column.links.map((link) => (
                    <li key={`${column.heading}-${link.label}`}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        ) : (
          <span aria-hidden="true" />
        )}

        <div className="roll-keyslip-legal">
          <p>
            Built by a self-taught pianist, for everyone teaching themselves. Free to learn with,
            always.
          </p>
          <nav aria-label="Legal" className="roll-keyslip-legal-links">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
