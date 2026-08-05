"use client";

import { Sidebar } from "@/components/tools/sidebar";
import {
  DashboardMobileTopBar,
  DashboardNavProvider,
} from "@/components/tools/dashboard-nav";
import { Onboarding } from "@/components/tools/onboarding";
import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";

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
        <WelcomeConfigProvider>
          <Onboarding />
        </WelcomeConfigProvider>
        <Sidebar />
        <div className="dashboard-main flex min-h-screen flex-col">
          {showMobileTopBar ? <DashboardMobileTopBar /> : null}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </DashboardNavProvider>
  );
}
