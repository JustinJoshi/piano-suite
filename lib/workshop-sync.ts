import type { PracticePage } from "@/lib/feature-blocks/types";

/**
 * Pure merge logic for Workshop page sync (local localStorage store ↔ Convex
 * Pro sync). Last-write-wins per page, keyed by the client-generated page id;
 * remote tombstones win over any local copy.
 */

export type RemoteDrill = {
  clientPageId: string;
  title: string;
  blocks: PracticePage["blocks"];
  deleted: boolean;
  updatedAt: number;
};

export type MergeResult = {
  /** Merged page list (local order preserved, remote-new pages appended). */
  pages: PracticePage[];
  /** True when the merged list differs from the local input. */
  localChanged: boolean;
  /** Local pages that are missing remotely or newer than the remote copy. */
  toPush: PracticePage[];
};

function samePage(a: PracticePage, b: PracticePage): boolean {
  return (
    a.id === b.id &&
    a.updatedAt === b.updatedAt &&
    a.title === b.title &&
    a.blocks.length === b.blocks.length
  );
}

export function mergeWithRemote(
  local: PracticePage[],
  remote: RemoteDrill[]
): MergeResult {
  const remoteById = new Map(remote.map((r) => [r.clientPageId, r]));

  const pages: PracticePage[] = [];
  const toPush: PracticePage[] = [];

  for (const localPage of local) {
    const remotePage = remoteById.get(localPage.id);

    if (remotePage?.deleted) {
      // Tombstone wins: drop the local copy.
      continue;
    }

    if (!remotePage) {
      pages.push(localPage);
      toPush.push(localPage);
      continue;
    }

    if (remotePage.updatedAt > localPage.updatedAt) {
      pages.push(remotePageToPage(remotePage));
      continue;
    }

    pages.push(localPage);
    if (localPage.updatedAt > remotePage.updatedAt) {
      toPush.push(localPage);
    }
  }

  // Remote pages this device has never seen (and were not deleted).
  const localIds = new Set(local.map((p) => p.id));
  for (const remotePage of remote) {
    if (remotePage.deleted) continue;
    if (localIds.has(remotePage.clientPageId)) continue;
    pages.push(remotePageToPage(remotePage));
  }

  const localChanged =
    pages.length !== local.length || pages.some((p, i) => !samePage(p, local[i]));

  return { pages, localChanged, toPush };
}

export function remotePageToPage(remote: RemoteDrill): PracticePage {
  return {
    id: remote.clientPageId,
    title: remote.title,
    blocks: remote.blocks,
    updatedAt: remote.updatedAt,
  };
}

/** Page ids that exist in `previous` but not in `next` (local deletions). */
export function deletedPageIds(
  previous: PracticePage[],
  next: PracticePage[]
): string[] {
  const nextIds = new Set(next.map((p) => p.id));
  return previous.filter((p) => !nextIds.has(p.id)).map((p) => p.id);
}
