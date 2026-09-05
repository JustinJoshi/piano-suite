"use client";

import { Sidebar } from "@/components/tools/sidebar";
import {
  DashboardMobileTopBar,
  DashboardNavProvider,
} from "@/components/tools/dashboard-nav";
import { Onboarding } from "@/components/tools/onboarding";
import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";
import { cn } from "@/lib/utils";

export function DashboardShell({
  children,
  showMobileTopBar = false,
}: {
  children: React.ReactNode;
  showMobileTopBar?: boolean;
}) {
  return (
    <DashboardNavProvider>
      <div className="relative z-10 min-h-screen bg-transparent">
        <a
          href="#main-content"
          className={cn(
            "sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50",
            "bg-primary text-primary-foreground rounded-md px-3 py-2"
          )}
        >
          Skip to content
        </a>
        <WelcomeConfigProvider>
          <Onboarding />
        </WelcomeConfigProvider>
        <Sidebar />
        <div className="dashboard-main flex min-h-screen flex-col">
          {showMobileTopBar ? <DashboardMobileTopBar /> : null}
          <main id="main-content" tabIndex={-1} className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </DashboardNavProvider>
  );
}
