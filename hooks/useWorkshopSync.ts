"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import {
  getPracticePageStore,
  setPracticePageStore,
  subscribePracticePageStore,
  getActivePage,
} from "@/lib/custom-practice-storage";
import {
  mergeWithRemote,
  deletedPageIds,
  type RemoteDrill,
} from "@/lib/workshop-sync";
import type { PracticePage } from "@/lib/feature-blocks/types";

export type WorkshopSyncStatus = "local" | "syncing" | "synced" | "error";

export type UseWorkshopSyncOptions = {
  /** Debounce for pushing local edits (exposed for tests). */
  pushDebounceMs?: number;
};

const PUSH_DEBOUNCE_MS = 1500;

/**
 * Keeps the Workshop localStorage page store in sync with the Convex
 * `customDrills` table for Pro users. Free users stay local-only.
 *
 * - Pull: reactive `listCustomDrills` query merged into the local store
 *   (last-write-wins per page; remote tombstones delete local copies).
 * - Push: debounced `upsertCustomDrill` for pages changed locally.
 * - Deletes: page-set diffs between store notifications become tombstones.
 */
export function useWorkshopSync(
  userReady: boolean,
  options: UseWorkshopSyncOptions = {}
): WorkshopSyncStatus {
  const { canPersist } = useAuthAccess();
  const [status, setStatus] = useState<WorkshopSyncStatus>("local");
  const pushDebounceMs = options.pushDebounceMs ?? PUSH_DEBOUNCE_MS;

  const remoteRows = useQuery(
    api.workshop.listCustomDrills,
    canPersist && userReady ? {} : "skip"
  );

  const upsertDrill = useMutation(api.workshop.upsertCustomDrill);
  const deleteDrill = useMutation(api.workshop.deleteCustomDrill);
  const upsertRef = useRef(upsertDrill);
  const deleteRef = useRef(deleteDrill);
  useEffect(() => {
    upsertRef.current = upsertDrill;
    deleteRef.current = deleteDrill;
  }, [upsertDrill, deleteDrill]);

  const suppressDiffRef = useRef(false);
  const lastPushedAtRef = useRef(new Map<string, number>());
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  // --- Pull + merge -------------------------------------------------------
  const mergedForRowsRef = useRef<RemoteDrill[] | null>(null);
  useEffect(() => {
    if (!canPersist || !userReady || remoteRows === undefined) {
      return;
    }

    const remote: RemoteDrill[] = remoteRows;
    if (mergedForRowsRef.current === remote) {
      return; // Already merged this snapshot.
    }
    mergedForRowsRef.current = remote;

    // Remote rows are by definition "pushed" — record their timestamps so an
    // unrelated debounced flush does not re-upload in-sync pages.
    for (const row of remote) {
      if (!row.deleted) {
        lastPushedAtRef.current.set(row.clientPageId, row.updatedAt);
      }
    }

    const store = getPracticePageStore();
    const activeIdBefore = store.activePageId;
    const { pages, localChanged, toPush } = mergeWithRemote(store.pages, remote);

    if (localChanged) {
      suppressDiffRef.current = true;
      setPracticePageStore({
        ...store,
        pages,
        activePageId: pages.some((p) => p.id === activeIdBefore)
          ? activeIdBefore
          : getActivePage({ ...store, pages }).id,
      });
      suppressDiffRef.current = false;
    }

    if (toPush.length > 0) {
      queueMicrotask(() => setStatus("syncing"));
      for (const page of toPush) {
        void pushPage(page);
      }
    } else {
      queueMicrotask(() => setStatus("synced"));
    }
  }, [remoteRows, canPersist, userReady]);

  async function pushPage(page: PracticePage): Promise<void> {
    const lastPushed = lastPushedAtRef.current.get(page.id) ?? 0;
    if (page.updatedAt <= lastPushed) return;

    try {
      await upsertRef.current({
        clientPageId: page.id,
        title: page.title,
        blocks: page.blocks,
        updatedAt: page.updatedAt,
      });
      lastPushedAtRef.current.set(page.id, page.updatedAt);
      if (statusRef.current !== "error") {
        setStatus("synced");
      }
    } catch (err) {
      console.error("Failed to sync workshop page", err);
      setStatus("error");
    }
  }

  // --- Push + delete diffing on local changes ------------------------------
  useEffect(() => {
    if (!canPersist || !userReady) {
      return;
    }

    let previousPages: PracticePage[] | null = null;

    function flushDiffs(storePages: PracticePage[]) {
      if (suppressDiffRef.current) {
        previousPages = storePages;
        return;
      }

      if (previousPages !== null) {
        for (const pageId of deletedPageIds(previousPages, storePages)) {
          void deleteRef
            .current({ clientPageId: pageId, updatedAt: Date.now() })
            .catch((err) => {
              console.error("Failed to delete workshop page remotely", err);
              setStatus("error");
            });
        }
      }
      previousPages = storePages;

      if (pushTimerRef.current !== null) {
        clearTimeout(pushTimerRef.current);
      }
      pushTimerRef.current = setTimeout(() => {
        pushTimerRef.current = null;
        const current = getPracticePageStore().pages;
        for (const page of current) {
          void pushPage(page);
        }
      }, pushDebounceMs);
    }

    const unsubscribe = subscribePracticePageStore(() => {
      flushDiffs(getPracticePageStore().pages);
    });

    // Prime the baseline with the current snapshot.
    previousPages = getPracticePageStore().pages;

    return () => {
      unsubscribe();
      if (pushTimerRef.current !== null) {
        clearTimeout(pushTimerRef.current);
        pushTimerRef.current = null;
      }
    };
  }, [canPersist, userReady, pushDebounceMs]);

  if (!canPersist) {
    return "local";
  }
  return status;
}
