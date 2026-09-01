"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings as SettingsIcon, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { AppUserButton } from "@/components/app-user-button";
import { AppliedLogoMark } from "@/components/brand/applied-logo-mark";
import { Button } from "@/components/ui/button";
import { useDashboardNav } from "@/components/tools/dashboard-nav";
import {
  drillTools,
  insightTools,
  shelfTool,
  workshopTool,
  type ToolDef,
} from "@/lib/tools";
import { cn } from "@/lib/utils";

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
              data-testid={`sidebar-link-${link.title.toLowerCase().replace(/\s+/g, "-")}`}
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

function NavSubLink({
  href,
  title,
  onNavigate,
}: {
  href: string;
  title: string;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        data-testid={`sidebar-link-${title.toLowerCase().replace(/\s+/g, "-")}`}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-1.5 pl-11 text-sm transition-colors",
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        {title}
      </Link>
    </li>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
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

        {/* Nav — four sections: Workshop, Shelf, Progress, Settings */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2">
            <ul className="space-y-0.5">
              <li>
                <Link
                  href={workshopTool.href}
                  onClick={closeDrawer}
                  data-testid="sidebar-link-workshop"
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
              <li>
                <Link
                  href="/routes"
                  onClick={closeDrawer}
                  data-testid="sidebar-link-routes"
                  className="flex items-center gap-3 rounded-lg px-3 py-1.5 pl-11 text-sm text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  Guided routes
                </Link>
              </li>
              {drillTools.map((drill) => (
                <NavSubLink
                  key={drill.href}
                  href={drill.href}
                  title={drill.title}
                  onNavigate={closeDrawer}
                />
              ))}
            </ul>
          </div>

          <div className="mb-2 mt-6">
            <ul className="space-y-0.5">
              <li>
                <Link
                  href={shelfTool.href}
                  onClick={closeDrawer}
                  data-testid="sidebar-link-shelf"
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    pathname === shelfTool.href
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/50"
                  )}
                >
                  <shelfTool.icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      pathname === shelfTool.href
                        ? "text-primary"
                        : "text-foreground group-hover:text-foreground"
                    )}
                  />
                  {shelfTool.title}
                </Link>
              </li>
            </ul>
          </div>

          <div className="mb-2 mt-6">
            <SectionLabel>Progress</SectionLabel>
            <ul className="space-y-0.5">
              <NavLinks links={insightTools} onNavigate={closeDrawer} />
            </ul>
          </div>

          <div className="mb-2 mt-6">
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/settings"
                  onClick={closeDrawer}
                  data-testid="sidebar-link-settings"
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    pathname === "/settings" ||
                      pathname.startsWith("/settings/")
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted/50"
                  )}
                >
                  <SettingsIcon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      pathname === "/settings" ||
                        pathname.startsWith("/settings/")
                        ? "text-primary"
                        : "text-foreground group-hover:text-foreground"
                    )}
                  />
                  Settings
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
