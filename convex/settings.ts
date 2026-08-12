import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUserId } from "./lib/auth";
import { ensureUserIdWithSync } from "./lib/entitlements";

/**
 * Generic per-user settings store.
 *
 * Tools store JSON-serializable values under a namespaced key so each drill
 * can persist preferences without adding a dedicated table.
 *
 * Writes require Pro sync (`ensureUserIdWithSync`). Free users keep prefs in
 * localStorage only (WP6). Queries stay soft for any signed-in identity.
 */

export const getSetting = query({
  args: { key: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if (!userId) {
      return null;
    }

    const setting = await ctx.db
      .query("settings")
      .withIndex("by_user_key", (q) => q.eq("userId", userId).eq("key", args.key))
      .unique();
    return setting?.value ?? null;
  },
});

export const setSetting = mutation({
  args: { key: v.string(), value: v.any() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user_key", (q) => q.eq("userId", userId).eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch("settings", existing._id, { value: args.value });
    } else {
      await ctx.db.insert("settings", {
        userId,
        key: args.key,
        value: args.value,
      });
    }

    return null;
  },
});
