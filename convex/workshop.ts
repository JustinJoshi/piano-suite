import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUserId, ensureUserId } from "./lib/auth";
import { ensureUserIdWithSync } from "./lib/entitlements";
import {
  normalizeStoredPage,
  normalizePageTitle,
  isValidClientPageId,
  MAX_PAGE_TITLE_LENGTH,
} from "../lib/feature-blocks/schemas";

const MAX_PAGES_PER_USER = 100;
const GALLERY_PAGE_SIZE = 60;

// ── Validators ────────────────────────────────────────────────────────────

const ownerDrillValidator = v.object({
  _id: v.id("customDrills"),
  clientPageId: v.string(),
  title: v.string(),
  blocks: v.array(v.any()),
  deleted: v.boolean(),
  isPublic: v.boolean(),
  updatedAt: v.number(),
});

const publicDrillValidator = v.object({
  _id: v.id("customDrills"),
  title: v.string(),
  blocks: v.array(v.any()),
  authorName: v.string(),
  forkedFrom: v.optional(v.string()),
  blockCount: v.number(),
  updatedAt: v.number(),
});

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * Lists the caller's workshop pages (live + tombstones). Returns [] when
 * signed out.
 */
export const listCustomDrills = query({
  args: {},
  returns: v.array(ownerDrillValidator),
  handler: async (ctx) => {
    const userId = await optionalUserId(ctx);
    if (!userId) {
      return [];
    }

    const rows = await ctx.db
      .query("customDrills")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .take(1000);

    return rows.map((row) => ({
      _id: row._id,
      clientPageId: row.clientPageId,
      title: row.title,
      blocks: row.blocks,
      deleted: row.deleted ?? false,
      isPublic: row.isPublic ?? false,
      updatedAt: row.updatedAt,
    }));
  },
});

/**
 * Public gallery: newest published pages. No auth required.
 */
export const listPublicDrills = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(publicDrillValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? GALLERY_PAGE_SIZE, 100);
    const rows = await ctx.db
      .query("customDrills")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .order("desc")
      .take(limit);

    return rows
      .filter((row) => !(row.deleted ?? false))
      .map((row) => ({
        _id: row._id,
        title: row.title,
        blocks: row.blocks,
        authorName: row.authorName ?? "Anonymous pianist",
        forkedFrom: row.forkedFrom,
        blockCount: row.blocks.length,
        updatedAt: row.updatedAt,
      }));
  },
});

/**
 * Fetch one public drill by its Convex id. Returns null when the drill
 * does not exist, is not public, or has been deleted.
 */
export const getPublicDrill = query({
  args: { drillId: v.id("customDrills") },
  returns: v.union(publicDrillValidator, v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db.get("customDrills", args.drillId);
    if (!row || row.isPublic !== true || (row.deleted ?? false)) {
      return null;
    }

    return {
      _id: row._id,
      title: row.title,
      blocks: row.blocks,
      authorName: row.authorName ?? "Anonymous pianist",
      forkedFrom: row.forkedFrom,
      blockCount: row.blocks.length,
      updatedAt: row.updatedAt,
    };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────

/**
 * Upserts a page (last-write-wins by `updatedAt`). Accepts an optional
 * `isPublic` flag — when set, the author name is pulled from the user row
 * so gallery listings show attribution without extra lookups.
 */
export const upsertCustomDrill = mutation({
  args: {
    clientPageId: v.string(),
    title: v.string(),
    blocks: v.array(v.any()),
    updatedAt: v.number(),
    isPublic: v.optional(v.boolean()),
  },
  returns: v.object({
    accepted: v.boolean(),
    updatedAt: v.number(),
    _id: v.id("customDrills"),
  }),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);

    if (!isValidClientPageId(args.clientPageId)) {
      throw new Error("Invalid page id");
    }

    const page = normalizeStoredPage({
      clientPageId: args.clientPageId,
      title: args.title,
      blocks: args.blocks,
      updatedAt: args.updatedAt,
    });
    if (!page) {
      throw new Error("Invalid practice page");
    }

    const existing = await ctx.db
      .query("customDrills")
      .withIndex("by_owner_client_id", (q) =>
        q.eq("ownerId", userId).eq("clientPageId", page.clientPageId)
      )
      .unique();

    if (existing && existing.updatedAt > page.updatedAt) {
      return {
        accepted: false,
        updatedAt: existing.updatedAt,
        _id: existing._id,
      };
    }

    const isPublic =
      args.isPublic !== undefined
        ? args.isPublic
        : existing?.isPublic ?? false;

    let authorName = existing?.authorName;
    if (isPublic && !authorName) {
      const user = await ctx.db.get("users", userId);
      authorName = user?.name || user?.email || "Anonymous pianist";
    }

    if (existing) {
      const doc = { ...existing, isPublic, authorName };
      await ctx.db.patch("customDrills", existing._id, {
        title: page.title,
        blocks: page.blocks,
        deleted: false,
        isPublic,
        authorName,
        updatedAt: page.updatedAt,
      });
      return {
        accepted: true,
        updatedAt: page.updatedAt,
        _id: existing._id,
      };
    }

    const all = await ctx.db
      .query("customDrills")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .take(1000);
    if (all.length >= MAX_PAGES_PER_USER) {
      throw new Error(
        `Workshop page limit reached (${MAX_PAGES_PER_USER}). Delete a page to add another.`
      );
    }

    const now = Date.now();
    const _id = await ctx.db.insert("customDrills", {
      ownerId: userId,
      clientPageId: page.clientPageId,
      title: page.title,
      blocks: page.blocks,
      deleted: false,
      isPublic,
      authorName,
      createdAt: now,
      updatedAt: page.updatedAt,
    });
    return { accepted: true, updatedAt: page.updatedAt, _id };
  },
});

/**
 * Soft-deletes a page (tombstone). When a deleted page was public it is
 * automatically un-published.
 */
export const deleteCustomDrill = mutation({
  args: { clientPageId: v.string(), updatedAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);

    if (!isValidClientPageId(args.clientPageId)) {
      throw new Error("Invalid page id");
    }

    const existing = await ctx.db
      .query("customDrills")
      .withIndex("by_owner_client_id", (q) =>
        q.eq("ownerId", userId).eq("clientPageId", args.clientPageId)
      )
      .unique();

    const deletedAt = Math.floor(args.updatedAt);
    if (!existing) {
      const now = Date.now();
      await ctx.db.insert("customDrills", {
        ownerId: userId,
        clientPageId: args.clientPageId,
        title: "Deleted page",
        blocks: [],
        deleted: true,
        createdAt: now,
        updatedAt: deletedAt,
      });
      return null;
    }

    if ((existing.deleted ?? false) && existing.updatedAt >= deletedAt) {
      return null;
    }

    await ctx.db.patch("customDrills", existing._id, {
      deleted: true,
      isPublic: false,
      updatedAt: Math.max(deletedAt, existing.updatedAt),
    });
    return null;
  },
});

/**
 * Fork a public drill into the caller's own collection. Works for any
 * signed-in user (not gated to Pro — forks land in localStorage for Free
 * users and are best-effort on the server). Returns the forked page's
 * Convex id, clientPageId, title, and blocks so the client can store it
 * locally. `forkedFrom` is flattened to the root original per the
 * CodePen-style fork chain.
 */
export const forkCustomDrill = mutation({
  args: { drillId: v.id("customDrills") },
  returns: v.union(
    v.object({
      _id: v.id("customDrills"),
      clientPageId: v.string(),
      title: v.string(),
      blocks: v.array(v.any()),
      authorName: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userId = await ensureUserId(ctx);
    const source = await ctx.db.get("customDrills", args.drillId);
    if (!source || source.isPublic !== true || (source.deleted ?? false)) {
      return null;
    }

    const user = await ctx.db.get("users", userId);
    const clientPageId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const rootForkedFrom = source.forkedFrom ?? source._id;
    const authorName = user?.name || user?.email || "Anonymous pianist";

    const _id = await ctx.db.insert("customDrills", {
      ownerId: userId,
      clientPageId,
      title: normalizePageTitle(source.title),
      blocks: source.blocks,
      deleted: false,
      isPublic: false,
      forkedFrom: rootForkedFrom,
      authorName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      _id,
      clientPageId,
      title: normalizePageTitle(source.title),
      blocks: source.blocks,
      authorName,
    };
  },
});
