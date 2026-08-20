import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUserId } from "./lib/auth";
import { ensureUserIdWithSync } from "./lib/entitlements";
import {
  normalizeStoredPage,
  isValidClientPageId,
} from "../lib/feature-blocks/schemas";

const MAX_PAGES_PER_USER = 100;

const customDrillValidator = v.object({
  clientPageId: v.string(),
  title: v.string(),
  blocks: v.array(v.any()),
  deleted: v.boolean(),
  updatedAt: v.number(),
});

/**
 * Lists the caller's workshop pages (live + tombstones so clients can apply
 * remote deletions). Returns [] when signed out.
 */
export const listCustomDrills = query({
  args: {},
  returns: v.array(customDrillValidator),
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
      clientPageId: row.clientPageId,
      title: row.title,
      blocks: row.blocks,
      deleted: row.deleted ?? false,
      updatedAt: row.updatedAt,
    }));
  },
});

/**
 * Upserts a page (last-write-wins by `updatedAt`). The envelope is validated
 * and sanitized with the shared feature-block schemas before storing, and
 * writes from stale tabs (older than the stored copy) are ignored.
 */
export const upsertCustomDrill = mutation({
  args: {
    clientPageId: v.string(),
    title: v.string(),
    blocks: v.array(v.any()),
    updatedAt: v.number(),
  },
  returns: v.object({ accepted: v.boolean(), updatedAt: v.number() }),
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
      // Stale write (e.g. an old tab): keep the newer stored copy.
      return { accepted: false, updatedAt: existing.updatedAt };
    }

    if (existing) {
      await ctx.db.patch("customDrills", existing._id, {
        title: page.title,
        blocks: page.blocks,
        deleted: false,
        updatedAt: page.updatedAt,
      });
      return { accepted: true, updatedAt: page.updatedAt };
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
    await ctx.db.insert("customDrills", {
      ownerId: userId,
      clientPageId: page.clientPageId,
      title: page.title,
      blocks: page.blocks,
      deleted: false,
      createdAt: now,
      updatedAt: page.updatedAt,
    });
    return { accepted: true, updatedAt: page.updatedAt };
  },
});

/**
 * Soft-deletes a page (tombstone) so other devices drop their local copy.
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
      updatedAt: Math.max(deletedAt, existing.updatedAt),
    });
    return null;
  },
});
