import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ensureUserId } from "./lib/auth";

export const currentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

export const ensureCurrentUser = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    return await ensureUserId(ctx);
  },
});
