"use client";

import { useDrillRuntime } from "@/lib/drill-runtime";
import type { PracticeNote } from "@/lib/practice-note";

const NO_STREAM: PracticeNote[] = [];

/**
 * The page's composed practice stream: every source block's output in page
 * order, with every transform applied in page order. Returns [] outside a
 * DrillRuntimeProvider or when the page has no source block.
 *
 * Display blocks read this instead of preview fixtures. This does not touch
 * the target list — target blocks keep their own registration path through
 * `hooks/useTargetSource.ts`.
 */
export function useNoteStream(): PracticeNote[] {
  const runtime = useDrillRuntime();
  return runtime?.stream ?? NO_STREAM;
}
