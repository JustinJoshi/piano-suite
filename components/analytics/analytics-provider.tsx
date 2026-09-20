"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { capturePageview, initAnalytics } from "@/lib/analytics";

export function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    capturePageview(pathname);
  }, [pathname]);

  return <>{children}</>;
}
