"use client";

import { useSyncExternalStore } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Aperture,
  ChevronDown,
  CreditCard,
  Fingerprint,
  Palette,
  Volume2,
  X,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { AppUserButton } from "@/components/app-user-button";
import { AppliedLogoMark } from "@/components/brand/applied-logo-mark";
import { Button } from "@/components/ui/button";
import { useDashboardNav } from "@/components/tools/dashboard-nav";
import { useExperimentalFeatures } from "@/hooks/useExperimentalFeatures";
import { isExperimentalToolHref } from "@/lib/experimental-features";
import {
  drillTools,
  insightTools,
  labTools,
  workshopTool,
  type ToolDef,
} from "@/lib/tools";
import { cn } from "@/lib/utils";

const LABS_NAV_STORAGE_KEY = "piano-suite-labs-nav-open-v1";
const LABS_NAV_CHANGE_EVENT = "piano-suite:labs-nav-change";

function readLabsNavOpen(): boolean {
  try {
    return window.localStorage.getItem(LABS_NAV_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeLabsNavOpen(open: boolean) {
  try {
    window.localStorage.setItem(LABS_NAV_STORAGE_KEY, String(open));
  } catch {
    // Private mode / quota — ignore.
  }
  window.dispatchEvent(new Event(LABS_NAV_CHANGE_EVENT));
}

function subscribeToLabsNav(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LABS_NAV_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LABS_NAV_CHANGE_EVENT, callback);
  };
}

/** Logo Lab is a branding utility, not a practice tool — sidebar only. */
const logoLabLink = {
  title: "Logo Lab",
  href: "/tools/logo-lab",
  icon: Fingerprint,
};

function NavLinks({
  links,
  onNavigate,
}: {
  links: { title: string; href: string; icon: ToolDef["icon"] }[];
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;

        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onNavigate}
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
              {link.title}
            </Link>
          </li>
        );
      })}
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

function LabsSection({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const { enabled: experimentalEnabled } = useExperimentalFeatures();
  const open = useSyncExternalStore(
    subscribeToLabsNav,
    readLabsNavOpen,
    () => false
  );

  function toggleOpen() {
    writeLabsNavOpen(!open);
  }

  const labs = [
    ...labTools,
    {
      title: logoLabLink.title,
      description: "",
      icon: logoLabLink.icon,
      href: logoLabLink.href,
      category: "lab" as const,
    },
  ].filter((lab) => experimentalEnabled || !isExperimentalToolHref(lab.href));
  const activeLab = labs.some((lab) => lab.href === pathname);

  return (
    <div>
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-controls="dashboard-sidebar-labs"
        className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        Labs
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open ? "rotate-180" : "rotate-0"
          )}
        />
        {activeLab ? (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
        ) : null}
      </button>
      {open ? (
        <ul id="dashboard-sidebar-labs" className="space-y-0.5">
          <NavLinks links={labs} onNavigate={onNavigate} />
        </ul>
      ) : null}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded, isSignedIn } = useUser();
  const { open, setOpen } = useDashboardNav();
  const closeDrawer = () => setOpen(false);
  const workshopActive = pathname === workshopTool.href;

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
        onClick={closeDrawer}
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
          <AppliedLogoMark className="h-8 w-8" title="Piano Suite" />
          <Link
            href="/"
            className="min-w-0 flex-1 font-heading text-base font-semibold tracking-tight text-foreground"
            onClick={closeDrawer}
          >
            Piano Suite
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close navigation menu"
            onClick={closeDrawer}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            <li>
              <Link
                href={workshopTool.href}
                onClick={closeDrawer}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  workshopActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted/50"
                )}
              >
                <workshopTool.icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    workshopActive
                      ? "text-primary"
                      : "text-foreground group-hover:text-foreground"
                  )}
                />
                {workshopTool.title}
              </Link>
            </li>
          </ul>

          <div className="mb-2 mt-6">
            <SectionLabel>Ready-made drills</SectionLabel>
            <ul className="space-y-0.5">
              <NavLinks links={drillTools} onNavigate={closeDrawer} />
            </ul>
          </div>

          <div className="mb-2 mt-6">
            <SectionLabel>Progress</SectionLabel>
            <ul className="space-y-0.5">
              <NavLinks links={insightTools} onNavigate={closeDrawer} />
            </ul>
          </div>

          <div className="mt-6">
            <LabsSection onNavigate={closeDrawer} />
          </div>

          <div className="mb-2 mt-6">
            <SectionLabel>Settings</SectionLabel>
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/settings/theme"
                  onClick={closeDrawer}
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
                  onClick={closeDrawer}
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
                  onClick={closeDrawer}
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
                  onClick={closeDrawer}
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
          </div>
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
