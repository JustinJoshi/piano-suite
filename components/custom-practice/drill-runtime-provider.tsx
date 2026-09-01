"use client";

import { useMemo } from "react";
import {
  DrillRuntimeProvider as RuntimeProvider,
  runtimeOptionsFromBlocks,
} from "@/lib/drill-runtime";
import { useDrillRuntimeProvider } from "@/hooks/useDrillRuntime";
import { PostDrillWaitlist } from "@/components/waitlist/post-drill-waitlist";

export function DrillRuntimeProvider({
  pageId,
  blocks,
  children,
}: {
  pageId: string;
  /** Page blocks; the drillTimer/chordSet configs drive the runtime. */
  blocks?: Array<{ type: string; config: unknown }>;
  children: React.ReactNode;
}) {
  const config = useMemo(() => runtimeOptionsFromBlocks(blocks ?? []), [blocks]);
  const runtime = useDrillRuntimeProvider({ pageId, ...config });
  return (
    <RuntimeProvider value={runtime}>
      {children}
      <PostDrillWaitlist />
    </RuntimeProvider>
  );
}
