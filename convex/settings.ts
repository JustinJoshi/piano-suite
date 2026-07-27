import { query, mutation, type QueryCtx, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";

async function currentUserId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) {
    throw new Error("User not found");
  }
  return user._id;
}

/**
 * Generic per-user settings store.
 *
 * Tools store JSON-serializable values under a namespaced key so each drill
 * can persist preferences without adding a dedicated table.
 */

export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_user_key", (q) => q.eq("userId", userId).eq("key", args.key))
      .unique();
    return setting?.value ?? null;
  },
});

export const setSetting = mutation({
  args: { key: v.string(), value: v.any() },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user_key", (q) => q.eq("userId", userId).eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("settings", {
        userId,
        key: args.key,
        value: args.value,
      });
    }
  },
});
