import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { optionalUserId } from "./lib/auth";
import { ensureUserIdWithSync } from "./lib/entitlements";

const DEFAULT_SESSION_LIMIT = 1000;
const MAX_SESSION_LIMIT = 5000;
const CLEAR_BATCH_SIZE = 1000;

function effectiveLimit(limit: number | undefined): number {
  return Math.min(Math.max(1, limit ?? DEFAULT_SESSION_LIMIT), MAX_SESSION_LIMIT);
}

const techniqueSessionValidator = v.object({
  _id: v.id("techniqueSessions"),
  _creationTime: v.number(),
  userId: v.id("users"),
  date: v.string(),
  exercise: v.string(),
  bpm: v.number(),
  notes: v.optional(v.string()),
  timestamp: v.number(),
});

export const listTechniqueSessions = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(techniqueSessionValidator),
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("techniqueSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(effectiveLimit(args.limit));
  },
});

export const logTechniqueSession = mutation({
  args: {
    date: v.string(),
    exercise: v.string(),
    bpm: v.number(),
    notes: v.optional(v.string()),
  },
  returns: v.id("techniqueSessions"),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    const existing = await ctx.db
      .query("techniqueSessions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", userId).eq("date", args.date)
      )
      .unique();

    if (existing) {
      await ctx.db.patch("techniqueSessions", existing._id, {
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
  returns: v.object({ count: v.number() }),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);

    // Fetch all existing sessions once to avoid N+1 queries during import.
    // Daily technique records are bounded, but paginate to satisfy query limits.
    const byDate = new Map<
      string,
      { _id: Id<"techniqueSessions">; date: string }
    >();
    let cursor: string | null = null;
    do {
      const page = await ctx.db
        .query("techniqueSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .paginate({ cursor, numItems: 1000 });
      for (const s of page.page) {
        byDate.set(s.date, s);
      }
      cursor = page.isDone ? null : page.continueCursor;
    } while (cursor);

    let count = 0;
    for (const s of args.sessions) {
      const existing = byDate.get(s.date);
      if (existing) {
        await ctx.db.patch("techniqueSessions", existing._id, {
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
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await ensureUserIdWithSync(ctx);

    // Paginate deletion to stay within Convex query limits.
    while (true) {
      const batch = await ctx.db
        .query("techniqueSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(CLEAR_BATCH_SIZE);
      if (batch.length === 0) break;
      await Promise.all(
        batch.map((s) => ctx.db.delete("techniqueSessions", s._id))
      );
    }
  },
});
