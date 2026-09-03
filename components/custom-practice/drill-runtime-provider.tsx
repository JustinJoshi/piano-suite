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
  /** Page blocks; the drillTimer/chordSet configs drive the runtime and the sources compose the stream. */
  blocks?: Array<{ id: string; type: string; config: unknown }>;
  children: React.ReactNode;
}) {
  const config = useMemo(() => runtimeOptionsFromBlocks(blocks ?? []), [blocks]);
  const runtime = useDrillRuntimeProvider({ pageId, ...config, blocks });
  return (
    <RuntimeProvider value={runtime}>
      {children}
      <PostDrillWaitlist />
    </RuntimeProvider>
  );
}
