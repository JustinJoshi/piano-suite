"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Music,
  Zap,
  RefreshCw,
  BarChart3,
  ArrowRightLeft,
  Timer,
  Palette,
  Waves,
  Sparkles,
  Infinity,
  Hexagon,
  LayoutGrid,
  Activity,
  Aperture,
  CreditCard,
  Volume2,
  Wrench,
  X,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { AppUserButton } from "@/components/app-user-button";
import { Button } from "@/components/ui/button";
import { useDashboardNav } from "@/components/tools/dashboard-nav";
import { useExperimentalFeatures } from "@/hooks/useExperimentalFeatures";
import { isExperimentalToolHref } from "@/lib/experimental-features";
import { cn } from "@/lib/utils";

const toolLinks = [
  { name: "Welcome", href: "/", icon: Home },
  { name: "Chord Drill", href: "/tools/chord-drill", icon: Music },
  { name: "Arpeggios", href: "/tools/arpeggios", icon: Zap },
  { name: "Root Cycling", href: "/tools/root-cycling", icon: RefreshCw },
  { name: "Progression", href: "/tools/progression", icon: ArrowRightLeft },
  { name: "Technique", href: "/tools/technique", icon: Timer },
  { name: "Tracking", href: "/tools/tracking", icon: BarChart3 },
  { name: "Workshop", href: "/tools/workshop", icon: Wrench },
  { name: "Chladni Lab", href: "/tools/chladni", icon: Waves },
  { name: "Chladni Ripple", href: "/tools/chladni-ripple", icon: Activity },
  { name: "Julia Lab", href: "/tools/julia", icon: Sparkles },
  { name: "Lissajous Lab", href: "/tools/lissajous", icon: Infinity },
  { name: "Quasiperiodic Lab", href: "/tools/quasiperiodic", icon: Hexagon },
  { name: "Multigrid Lab", href: "/tools/multigrid", icon: LayoutGrid },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded, isSignedIn } = useUser();
  const { open, setOpen } = useDashboardNav();
  const { enabled: experimentalEnabled } = useExperimentalFeatures();
  const visibleToolLinks = toolLinks.filter(
    (link) => experimentalEnabled || !isExperimentalToolHref(link.href)
  );

  const accountLabel =
    isLoaded && isSignedIn
      ? (user?.fullName ??
        user?.primaryEmailAddress?.emailAddress ??
        "Pianist")
      : "Anonymous pianist";

  return (
    <>
      <div
        role="presentation"
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-sm transition-opacity md:hidden",
          open
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
        data-testid="dashboard-sidebar-backdrop"
      />

      <aside
        id="dashboard-sidebar"
        className={cn(
          "dashboard-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border/50 bg-sidebar-background transition-transform duration-200 ease-out md:z-40 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="dashboard-sidebar"
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 border-b border-border/50 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Music className="h-4 w-4" />
          </div>
          <Link
            href="/"
            className="min-w-0 flex-1 font-heading text-base font-semibold tracking-tight text-foreground"
            onClick={() => setOpen(false)}
          >
            Piano Suite
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Practice Tools
          </div>
          <ul className="space-y-0.5">
            {visibleToolLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {link.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Settings
          </div>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/settings/theme"
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/settings/theme"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Palette
                  className={cn(
                    "h-4 w-4 transition-colors",
                    pathname === "/settings/theme"
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                Theme
              </Link>
            </li>
            <li>
              <Link
                href="/settings/atmosphere"
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/settings/atmosphere"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Aperture
                  className={cn(
                    "h-4 w-4 transition-colors",
                    pathname === "/settings/atmosphere"
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                Atmosphere
              </Link>
            </li>
            <li>
              <Link
                href="/settings/audio"
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/settings/audio"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Volume2
                  className={cn(
                    "h-4 w-4 transition-colors",
                    pathname === "/settings/audio"
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                Audio
              </Link>
            </li>
            <li>
              <Link
                href="/settings/billing"
                onClick={() => setOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === "/settings/billing"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <CreditCard
                  className={cn(
                    "h-4 w-4 transition-colors",
                    pathname === "/settings/billing"
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                Billing
              </Link>
            </li>
          </ul>
        </nav>

        {/* User account */}
        <div className="border-t border-border/50 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground">
            <AppUserButton
              appearance={{
                elements: {
                  avatarBox: "h-6 w-6 rounded-full",
                },
              }}
            />
            <span className="truncate">{accountLabel}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
