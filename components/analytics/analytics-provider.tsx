"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  capturePageview,
  identifyUser,
  initAnalytics,
  resetAnalytics,
} from "@/lib/analytics";

export function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const previousUserId = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    capturePageview(pathname);
  }, [pathname]);

  // Link events to the Clerk user, and start a fresh anonymous person on
  // sign-out. Only reset on a real transition, never on a first anonymous load,
  // so returning visitors keep one anonymous distinct id.
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const userId = user?.id ?? null;
    if (userId) {
      identifyUser(userId);
      previousUserId.current = userId;
      return;
    }

    if (previousUserId.current) {
      resetAnalytics();
    }
    previousUserId.current = null;
  }, [isLoaded, user?.id]);

  return <>{children}</>;
}
