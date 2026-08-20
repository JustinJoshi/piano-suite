import { describe, it, expect } from "vitest";
import {
  mergeWithRemote,
  deletedPageIds,
  remotePageToPage,
  type RemoteDrill,
} from "@/lib/workshop-sync";
import type { PracticePage } from "@/lib/feature-blocks/types";

function page(overrides: Partial<PracticePage> = {}): PracticePage {
  return {
    id: "page-a",
    title: "Warmup",
    blocks: [],
    updatedAt: 1000,
    ...overrides,
  };
}

function remote(overrides: Partial<RemoteDrill> = {}): RemoteDrill {
  return {
    clientPageId: "page-a",
    title: "Warmup",
    blocks: [],
    deleted: false,
    updatedAt: 1000,
    ...overrides,
  };
}

describe("mergeWithRemote", () => {
  it("keeps local pages and pushes them when remote is empty", () => {
    const local = [page()];

    const result = mergeWithRemote(local, []);

    expect(result.pages).toEqual(local);
    expect(result.localChanged).toBe(false);
    expect(result.toPush).toEqual(local);
  });

  it("replaces a local page when the remote copy is newer", () => {
    const local = [page({ updatedAt: 1000, title: "Old" })];
    const remotes = [remote({ updatedAt: 2000, title: "New" })];

    const result = mergeWithRemote(local, remotes);

    expect(result.pages[0].title).toBe("New");
    expect(result.localChanged).toBe(true);
    expect(result.toPush).toEqual([]);
  });

  it("pushes a local page when it is newer than the remote copy", () => {
    const local = [page({ updatedAt: 3000, title: "Edited locally" })];
    const remotes = [remote({ updatedAt: 2000, title: "Remote" })];

    const result = mergeWithRemote(local, remotes);

    expect(result.pages[0].title).toBe("Edited locally");
    expect(result.localChanged).toBe(false);
    expect(result.toPush).toEqual(local);
  });

  it("drops local pages that are tombstoned remotely", () => {
    const local = [
      page({ id: "page-a" }),
      page({ id: "page-b", title: "Kept" }),
    ];
    const remotes = [remote({ clientPageId: "page-a", deleted: true })];

    const result = mergeWithRemote(local, remotes);

    expect(result.pages.map((p) => p.id)).toEqual(["page-b"]);
    expect(result.localChanged).toBe(true);
    expect(result.toPush.map((p) => p.id)).toEqual(["page-b"]);
  });

  it("adds remote pages this device has never seen", () => {
    const local = [page({ id: "page-a" })];
    const remotes = [
      remote({ clientPageId: "page-a" }),
      remote({ clientPageId: "page-z", title: "From another device" }),
    ];

    const result = mergeWithRemote(local, remotes);

    expect(result.pages.map((p) => p.id)).toEqual(["page-a", "page-z"]);
    expect(result.localChanged).toBe(true);
    expect(result.toPush).toEqual([]);
  });

  it("ignores remote tombstones for unknown pages", () => {
    const local = [page({ id: "page-a" })];
    const remotes = [
      remote({ clientPageId: "page-gone", deleted: true }),
    ];

    const result = mergeWithRemote(local, remotes);

    expect(result.pages.map((p) => p.id)).toEqual(["page-a"]);
    expect(result.localChanged).toBe(false);
  });

  it("treats equal timestamps as in-sync (no push)", () => {
    const local = [page({ updatedAt: 2000 })];
    const remotes = [remote({ updatedAt: 2000 })];

    const result = mergeWithRemote(local, remotes);

    expect(result.localChanged).toBe(false);
    expect(result.toPush).toEqual([]);
  });
});

describe("deletedPageIds", () => {
  it("returns ids present before and missing after", () => {
    const before = [page({ id: "a" }), page({ id: "b" })];
    const after = [page({ id: "b" })];

    expect(deletedPageIds(before, after)).toEqual(["a"]);
  });

  it("returns nothing when nothing was deleted", () => {
    const before = [page({ id: "a" })];
    const after = [page({ id: "a" }), page({ id: "b" })];

    expect(deletedPageIds(before, after)).toEqual([]);
  });
});

describe("remotePageToPage", () => {
  it("maps the remote row onto the local page shape", () => {
    const result = remotePageToPage(
      remote({ clientPageId: "x", title: "T", updatedAt: 5 })
    );
    expect(result).toEqual({
      id: "x",
      title: "T",
      blocks: [],
      updatedAt: 5,
    });
  });
});
