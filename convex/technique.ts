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

export const listTechniqueSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);
    return await ctx.db
      .query("techniqueSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const logTechniqueSession = mutation({
  args: {
    date: v.string(),
    exercise: v.string(),
    bpm: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    const existing = await ctx.db
      .query("techniqueSessions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        exercise: args.exercise,
        bpm: args.bpm,
        notes: args.notes,
        timestamp: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("techniqueSessions", {
      userId,
      date: args.date,
      exercise: args.exercise,
      bpm: args.bpm,
      notes: args.notes,
      timestamp: Date.now(),
    });
  },
});

export const bulkImportTechniqueSessions = mutation({
  args: {
    sessions: v.array(
      v.object({
        date: v.string(),
        exercise: v.string(),
        bpm: v.number(),
        notes: v.optional(v.string()),
        timestamp: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx);
    let count = 0;

    for (const s of args.sessions) {
      const existing = await ctx.db
        .query("techniqueSessions")
        .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", s.date))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          exercise: s.exercise,
          bpm: s.bpm,
          notes: s.notes,
          timestamp: s.timestamp,
        });
      } else {
        await ctx.db.insert("techniqueSessions", {
          userId,
          date: s.date,
          exercise: s.exercise,
          bpm: s.bpm,
          notes: s.notes,
          timestamp: s.timestamp,
        });
      }
      count++;
    }

    return { count };
  },
});

export const clearTechniqueSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await currentUserId(ctx);
    const sessions = await ctx.db
      .query("techniqueSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const s of sessions) {
      await ctx.db.delete(s._id);
    }
  },
});
