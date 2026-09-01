"use client";

import { Sidebar } from "@/components/tools/sidebar";
import {
  DashboardMobileTopBar,
  DashboardNavProvider,
} from "@/components/tools/dashboard-nav";

/**
 * Phase 1.7: the onboarding deck no longer gates the dashboard. It lives
 * at /learn/practice-pillars (inline, reachable from the Learn door and
 * /settings) and the pillars are also a plain article.
 */
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
        <Sidebar />
        <div className="dashboard-main flex min-h-screen flex-col">
          {showMobileTopBar ? <DashboardMobileTopBar /> : null}
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </DashboardNavProvider>
  );
}
