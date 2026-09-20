"use client";

import { useSyncExternalStore } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Aperture,
  ChevronDown,
  CreditCard,
  Palette,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { AppUserButton } from "@/components/app-user-button";
import { AppliedLogoMark } from "@/components/brand/applied-logo-mark";
import { Keybed } from "@/components/brand/keybed";
import { Button } from "@/components/ui/button";
import { useDashboardNav } from "@/components/tools/dashboard-nav";
import { useExperimentalFeatures } from "@/hooks/useExperimentalFeatures";
import { isExperimentalToolHref } from "@/lib/experimental-features";
import {
  drillTools,
  insightTools,
  labTools,
  workshopTool,
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

type NavLinkDef = { title: string; href: string; icon: LucideIcon };

const settingsLinks: NavLinkDef[] = [
  { title: "Theme", href: "/settings/theme", icon: Palette },
  { title: "Atmosphere", href: "/settings/atmosphere", icon: Aperture },
  { title: "Audio", href: "/settings/audio", icon: Volume2 },
  { title: "Billing", href: "/settings/billing", icon: CreditCard },
];

/** Hue of the section dot; mirrors the three doors on the landing page. */
type SectionTone = "play" | "learn" | "explore" | "muted";

const toneDot: Record<SectionTone, string> = {
  play: "bg-door-play",
  learn: "bg-door-learn",
  explore: "bg-door-explore",
  muted: "bg-muted-foreground/50",
};

function testIdFor(title: string) {
  return `sidebar-link-${title.toLowerCase().replace(/\s+/g, "-")}`;
}

function NavLinks({
  links,
  onNavigate,
  emphasis = "default",
}: {
  links: NavLinkDef[];
  onNavigate: () => void;
  emphasis?: "default" | "strong";
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
              data-testid={testIdFor(link.title)}
              data-active={isActive ? "true" : undefined}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "nav-key group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                emphasis === "strong" ? "font-semibold" : "font-medium",
                isActive
                  ? "bg-primary/12 text-foreground"
                  : emphasis === "strong"
                    ? "text-foreground hover:bg-muted/60"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="truncate">{link.title}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
}

function SectionLabel({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: SectionTone;
}) {
  return (
    <div className="mb-2 flex items-center gap-2 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", toneDot[tone])} />
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

  const labs: NavLinkDef[] = [
    ...labTools,
  ].filter((lab) => experimentalEnabled || !isExperimentalToolHref(lab.href));
  const activeLab = labs.some((lab) => lab.href === pathname);

  return (
    <div>
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-controls="dashboard-sidebar-labs"
        className="mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", toneDot.explore)} />
        Labs
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open ? "rotate-180" : "rotate-0"
          )}
        />
        {activeLab ? (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_1px_var(--primary-glow)]" />
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
  const { user, isLoaded, isSignedIn } = useUser();
  const { open, setOpen } = useDashboardNav();
  const closeDrawer = () => setOpen(false);

  const accountLabel =
    isLoaded && isSignedIn
      ? (user?.fullName ??
        user?.primaryEmailAddress?.emailAddress ??
        "Pianist")
      : "Anonymous pianist";

  const workshopLink: NavLinkDef = {
    title: workshopTool.title,
    href: workshopTool.href,
    icon: workshopTool.icon,
  };

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
          "dashboard-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-sidebar-background transition-transform duration-200 ease-out md:z-40 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="dashboard-sidebar"
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
            <AppliedLogoMark className="h-5 w-5" title="Piano Suite" />
          </span>
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
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Studio">
          <ul className="space-y-0.5">
            <li>
              <WorkshopLink link={workshopLink} onNavigate={closeDrawer} />
            </li>
          </ul>

          <div className="mb-2 mt-6">
            <SectionLabel tone="play">Ready-made drills</SectionLabel>
            <ul className="space-y-0.5">
              <NavLinks links={drillTools} onNavigate={closeDrawer} />
            </ul>
          </div>

          <div className="mb-2 mt-6">
            <SectionLabel tone="learn">Progress</SectionLabel>
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
              <NavLinks links={settingsLinks} onNavigate={closeDrawer} />
            </ul>
          </div>
        </nav>

        {/* User account */}
        <div className="border-t border-border">
          <Keybed octaves={4} className="h-3 w-full opacity-70" />
          <div className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
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

function WorkshopLink({
  link,
  onNavigate,
}: {
  link: NavLinkDef;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === link.href;
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      data-testid="sidebar-link-workshop"
      data-active={isActive ? "true" : undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "nav-key group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
        isActive
          ? "border-primary/30 bg-primary/12 text-foreground shadow-[0_0_24px_-12px_var(--primary-glow)]"
          : "border-transparent text-foreground hover:border-border hover:bg-muted/60"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground group-hover:bg-primary/15 group-hover:text-primary"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      {link.title}
      <span className="ml-auto rounded-full border border-accent/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
        Beta
      </span>
    </Link>
  );
}
