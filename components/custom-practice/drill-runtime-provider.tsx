"use client";

import { DrillRuntimeProvider as RuntimeProvider } from "@/lib/drill-runtime";
import { useDrillRuntimeProvider } from "@/hooks/useDrillRuntime";

export function DrillRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const runtime = useDrillRuntimeProvider();
  return <RuntimeProvider value={runtime}>{children}</RuntimeProvider>;
}
