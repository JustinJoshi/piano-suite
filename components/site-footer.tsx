import Link from "next/link";
import { AppliedLogoMark } from "@/components/brand/applied-logo-mark";
import { Keybed } from "@/components/brand/keybed";
import { cn } from "@/lib/utils";

const footerLinks = [
  { label: "Workshop", href: "/tools/workshop" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Articles", href: "/articles" },
  { label: "Pricing", href: "/pricing" },
];

/**
 * Shared public footer. A keybed runs along the top edge so every marketing
 * page ends on the same instrument. Terms and Privacy stay in the footer
 * because the go-live e2e spec counts them on `/pricing`.
 */
export function SiteFooter({
  className,
  compact = false,
}: {
  className?: string;
  /** Hide the primary link row (pages that already list those links). */
  compact?: boolean;
}) {
  return (
    <footer className={cn("relative mt-auto", className)}>
      <Keybed octaves={7} className="h-5 w-full sm:h-7" />
      <div className="border-t border-border bg-card/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <AppliedLogoMark className="h-8 w-8 text-primary" title="Piano Suite" />
            <div>
              <div className="font-heading text-base font-semibold text-foreground">
                Piano Suite
              </div>
              <p className="text-sm text-muted-foreground">
                A free practice community for self-taught pianists.
              </p>
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
          >
            {!compact
              ? footerLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </Link>
                ))
              : null}
            <Link
              href="/terms"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
