"use client";

import { useEffect } from "react";
import { useDrillRuntime } from "@/lib/drill-runtime";
import type { PracticeNote } from "@/lib/practice-note";

export type RuntimeSourceState = {
  /** False outside a `DrillRuntimeProvider` (e.g. a library preview). */
  hasRuntime: boolean;
};

/**
 * Shared plumbing for every block that produces stream notes at runtime
 * (today: the uploaded-MIDI piece). Registers the block's notes with the
 * runtime while mounted; `buildStream` reads them through the block id.
 *
 * `notes` must be memoised by the caller — it is an effect dependency, and
 * registering the same array twice is a no-op by reference comparison, but a
 * fresh array each render would re-compose the page's stream every render.
 */
export function useRuntimeSource(
  blockId: string,
  notes: PracticeNote[]
): RuntimeSourceState {
  const runtime = useDrillRuntime();
  const setRuntimeSourceNotes = runtime?.setRuntimeSourceNotes;
  const clearRuntimeSourceNotes = runtime?.clearRuntimeSourceNotes;

  useEffect(() => {
    if (!setRuntimeSourceNotes) return;
    setRuntimeSourceNotes(blockId, notes);
    return () => {
      clearRuntimeSourceNotes?.(blockId);
    };
  }, [setRuntimeSourceNotes, clearRuntimeSourceNotes, blockId, notes]);

  return { hasRuntime: Boolean(runtime) };
}

