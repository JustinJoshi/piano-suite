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

/** How far the page scrolls before the bar picks up its glass and hairline. */
const SCROLLED_THRESHOLD_PX = 8;

/**
 * Public site chrome. Wordmark on the left, a pill nav in the middle with a
 * lit underline for the active section, account on the right.
 *
 * At the top of the page the bar is clear, so the hero atmosphere runs to
 * the very top edge; once the page scrolls it gathers glass, a hairline,
 * and a soft shadow so content passing underneath stays legible.
 */
export function Navbar() {
  const pathname = usePathname() ?? "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > SCROLLED_THRESHOLD_PX);
    };
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Escape closes the mobile menu (the menu is a disclosure, not a dialog,
  // so it doesn't trap focus — but it should still dismiss from the keyboard).
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  const raised = scrolled || mobileMenuOpen;

  return (
    <header
      data-scrolled={raised ? "true" : undefined}
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out",
        raised
          ? "glass border-border shadow-[0_12px_32px_-24px_var(--key-shadow)]"
          : "border-transparent bg-transparent"
      )}
    >
      <a
        href="#main-content"
        className="sr-only rounded-full bg-action px-4 py-2 text-sm font-medium text-action-foreground shadow-key focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60]"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-lg text-foreground"
          aria-label="Piano Suite home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20 transition-[background-color,box-shadow] duration-200 group-hover:bg-primary/18 group-hover:shadow-[0_0_18px_-4px_var(--primary-glow)]">
            <AppliedLogoMark
              className="h-5 w-5 origin-bottom transition-transform duration-300 ease-key group-hover:-rotate-6 motion-reduce:transition-none motion-reduce:group-hover:rotate-0"
              title="Piano Suite"
            />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">
            Piano Suite
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className={cn(
            "hidden items-center gap-0.5 rounded-full border p-1 transition-colors duration-300 md:flex",
            raised
              ? "border-border bg-card/60"
              : "border-border/70 bg-card/35 backdrop-blur-md"
          )}
        >
          {navLinks.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-primary/12 text-foreground"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
          className="animate-in fade-in slide-in-from-top-1 border-t border-border duration-200 md:hidden motion-reduce:animate-none"
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
