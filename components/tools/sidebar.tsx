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
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { AppUserButton } from "@/components/app-user-button";
import { cn } from "@/lib/utils";

const toolLinks = [
  { name: "Welcome", href: "/", icon: Home },
  { name: "Chord Drill", href: "/tools/chord-drill", icon: Music },
  { name: "Arpeggios", href: "/tools/arpeggios", icon: Zap },
  { name: "Root Cycling", href: "/tools/root-cycling", icon: RefreshCw },
  { name: "Progression", href: "/tools/progression", icon: ArrowRightLeft },
  { name: "Technique", href: "/tools/technique", icon: Timer },
  { name: "Tracking", href: "/tools/tracking", icon: BarChart3 },
  { name: "Chladni Lab", href: "/tools/chladni", icon: Waves },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  return (
    <aside className="dashboard-sidebar fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border/50 bg-sidebar-background">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-border/50 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Music className="h-4 w-4" />
        </div>
        <Link
          href="/"
          className="font-heading text-base font-semibold tracking-tight text-foreground"
        >
          Piano Suite
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Practice Tools
        </div>
        <ul className="space-y-0.5">
          {toolLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
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
          <span className="truncate">
            {isLoaded ? user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Pianist" : "Pianist"}
          </span>
        </div>
      </div>
    </aside>
  );
}
