"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  Show,
} from "@clerk/nextjs";
import { AppUserButton } from "@/components/app-user-button";
import { AppliedLogoMark } from "@/components/brand/applied-logo-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Workshop", href: "/tools/workshop" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Pricing", href: "/pricing" },
  { label: "Articles", href: "/articles" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Public site chrome. Glass bar, wordmark on the left, a pill nav in the
 * middle with a lit underline for the active section, account on the right.
 */
export function Navbar() {
  const pathname = usePathname() ?? "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMobileMenuOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <header className="glass sticky top-0 z-50 w-full border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-foreground"
          aria-label="Piano Suite home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/18">
            <AppliedLogoMark className="h-5 w-5" title="Piano Suite" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">
            Piano Suite
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 rounded-full border border-border bg-card/60 p-1 md:flex"
        >
          {navLinks.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/12 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {link.label}
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-4 -bottom-[5px] h-0.5 rounded-full bg-primary shadow-[0_0_10px_1px_var(--primary-glow)]"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          <Show when="signed-out">
            <SignInButton>
              <Button
                variant="ghost"
                size="sm"
                className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button size="sm" className="rounded-full px-4">
                Try it free
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <AppUserButton />
          </Show>
        </div>
      </div>

      {mobileMenuOpen ? (
        <nav
          id="mobile-nav-menu"
          aria-label="Primary (mobile)"
          className="border-t border-border md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-3 sm:px-6 lg:px-8">
            {navLinks.map((link, index) => {
              const active = isActivePath(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-primary/30 bg-primary/12 text-foreground"
                      : "border-border bg-card/70 text-muted-foreground hover:bg-elevated hover:text-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-[0.65rem] tracking-wider text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {link.label}
                  </span>
                  {active ? (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_1px_var(--primary-glow)]"
                    />
                  ) : null}
                </Link>
              );
            })}
            <Show when="signed-out">
              <SignInButton>
                <button
                  type="button"
                  className="mt-1 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:hidden"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign in
                </button>
              </SignInButton>
            </Show>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
