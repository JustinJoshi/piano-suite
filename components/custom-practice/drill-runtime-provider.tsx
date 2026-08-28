"use client";

import { DrillRuntimeProvider as RuntimeProvider } from "@/lib/drill-runtime";
import { useDrillRuntimeProvider } from "@/hooks/useDrillRuntime";

export function DrillRuntimeProvider({
  pageId,
  children,
}: {
  pageId: string;
  children: React.ReactNode;
}) {
  const runtime = useDrillRuntimeProvider({ pageId });
  return <RuntimeProvider value={runtime}>{children}</RuntimeProvider>;
}
