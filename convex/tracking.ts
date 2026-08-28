import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUserId } from "./lib/auth";
import { ensureUserIdWithSync } from "./lib/entitlements";

const DEFAULT_EVENT_LIMIT = 1000;
const MAX_EVENT_LIMIT = 5000;

function effectiveLimit(limit: number | undefined): number {
  return Math.min(Math.max(1, limit ?? DEFAULT_EVENT_LIMIT), MAX_EVENT_LIMIT);
}

const practiceEventValidator = v.object({
  _id: v.id("practiceEvents"),
  _creationTime: v.number(),
  userId: v.id("users"),
  tool: v.string(),
  chord: v.optional(v.string()),
  fromDeg: v.optional(v.string()),
  toDeg: v.optional(v.string()),
  root: v.optional(v.string()),
  quality: v.optional(v.string()),
  mode: v.optional(v.string()),
  progression: v.optional(v.string()),
  key: v.optional(v.string()),
  stepLabel: v.optional(v.string()),
  reactionTimeMs: v.number(),
  grade: v.optional(v.string()),
  redo: v.boolean(),
  timestamp: v.number(),
  pageId: v.optional(v.string()),
});

const missEventValidator = v.object({
  _id: v.id("missEvents"),
  _creationTime: v.number(),
  userId: v.id("users"),
  tool: v.string(),
  chord: v.string(),
  fromDeg: v.string(),
  toDeg: v.string(),
  played: v.string(),
  timestamp: v.number(),
  pageId: v.optional(v.string()),
});

async function listEventsForUserOrEmpty<T>(
  ctx: Parameters<typeof optionalUserId>[0],
  load: (userId: Awaited<ReturnType<typeof optionalUserId>> & {}) => Promise<T[]>
): Promise<T[]> {
  const userId = await optionalUserId(ctx);
  if (!userId) {
    return [];
  }
  return await load(userId);
}

// --------------------------------------------------------------------------
// Queries
// --------------------------------------------------------------------------

export const listChordDrillEvents = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(practiceEventValidator),
  handler: async (ctx, args) => {
    return await listEventsForUserOrEmpty(ctx, async (userId) =>
      await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) =>
          q.eq("userId", userId).eq("tool", "chord-drill")
        )
        .order("desc")
        .take(effectiveLimit(args.limit))
    );
  },
});

export const listArpeggioEvents = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(practiceEventValidator),
  handler: async (ctx, args) => {
    return await listEventsForUserOrEmpty(ctx, async (userId) =>
      await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) =>
          q.eq("userId", userId).eq("tool", "arpeggios")
        )
        .order("desc")
        .take(effectiveLimit(args.limit))
    );
  },
});

export const listArpeggioMissEvents = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(missEventValidator),
  handler: async (ctx, args) => {
    return await listEventsForUserOrEmpty(ctx, async (userId) =>
      await ctx.db
        .query("missEvents")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(effectiveLimit(args.limit))
    );
  },
});

export const listRootCycleEvents = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(practiceEventValidator),
  handler: async (ctx, args) => {
    return await listEventsForUserOrEmpty(ctx, async (userId) =>
      await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) =>
          q.eq("userId", userId).eq("tool", "root-cycling")
        )
        .order("desc")
        .take(effectiveLimit(args.limit))
    );
  },
});

export const listProgressionEvents = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(practiceEventValidator),
  handler: async (ctx, args) => {
    return await listEventsForUserOrEmpty(ctx, async (userId) =>
      await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) =>
          q.eq("userId", userId).eq("tool", "progression")
        )
        .order("desc")
        .take(effectiveLimit(args.limit))
    );
  },
});

// --------------------------------------------------------------------------
// Generic queries (used by custom drills / workshop)
// --------------------------------------------------------------------------

export const listPracticeEventsByTool = query({
  args: { tool: v.string(), limit: v.optional(v.number()) },
  returns: v.array(practiceEventValidator),
  handler: async (ctx, args) => {
    return await listEventsForUserOrEmpty(ctx, async (userId) =>
      await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) =>
          q.eq("userId", userId).eq("tool", args.tool)
        )
        .order("desc")
        .take(effectiveLimit(args.limit))
    );
  },
});

export const listMissEventsByTool = query({
  args: { tool: v.string(), limit: v.optional(v.number()) },
  returns: v.array(missEventValidator),
  handler: async (ctx, args) => {
    const userId = await optionalUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("missEvents")
      .withIndex("by_user_tool", (q) =>
        q.eq("userId", userId).eq("tool", args.tool),
      )
      .order("desc")
      .take(effectiveLimit(args.limit));
  },
});

// --------------------------------------------------------------------------
// Mutations - single events
// --------------------------------------------------------------------------

export const logChordDrillEvent = mutation({
  args: {
    chord: v.string(),
    reactionTimeMs: v.number(),
    redo: v.boolean(),
    grade: v.optional(v.string()),
  },
  returns: v.id("practiceEvents"),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    return await ctx.db.insert("practiceEvents", {
      userId,
      tool: "chord-drill",
      chord: args.chord,
      reactionTimeMs: args.reactionTimeMs,
      grade: args.grade,
      redo: args.redo,
      timestamp: Date.now(),
    });
  },
});

export const updateChordDrillGrade = mutation({
  args: {
    eventId: v.id("practiceEvents"),
    grade: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    const event = await ctx.db.get("practiceEvents", args.eventId);
    if (!event || event.userId !== userId || event.tool !== "chord-drill") {
      throw new Error("Event not found");
    }
    await ctx.db.patch("practiceEvents", args.eventId, { grade: args.grade });
  },
});

export const logArpeggioTransition = mutation({
  args: {
    chord: v.string(),
    fromDeg: v.string(),
    toDeg: v.string(),
    reactionTimeMs: v.number(),
  },
  returns: v.id("practiceEvents"),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    return await ctx.db.insert("practiceEvents", {
      userId,
      tool: "arpeggios",
      chord: args.chord,
      fromDeg: args.fromDeg,
      toDeg: args.toDeg,
      reactionTimeMs: args.reactionTimeMs,
      redo: false,
      timestamp: Date.now(),
    });
  },
});

export const logArpeggioMiss = mutation({
  args: {
    chord: v.string(),
    fromDeg: v.string(),
    toDeg: v.string(),
    played: v.string(),
  },
  returns: v.id("missEvents"),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    return await ctx.db.insert("missEvents", {
      userId,
      tool: "arpeggios",
      chord: args.chord,
      fromDeg: args.fromDeg,
      toDeg: args.toDeg,
      played: args.played,
      timestamp: Date.now(),
    });
  },
});

export const logRootCycleEvent = mutation({
  args: {
    mode: v.string(), // "chord" | "arpeggio"
    label: v.optional(v.string()),
    root: v.optional(v.string()),
    quality: v.optional(v.string()),
    fromDeg: v.optional(v.string()),
    toDeg: v.optional(v.string()),
    reactionTimeMs: v.number(),
  },
  returns: v.id("practiceEvents"),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    return await ctx.db.insert("practiceEvents", {
      userId,
      tool: "root-cycling",
      mode: args.mode,
      chord: args.mode === "arpeggio" ? undefined : args.label,
      root: args.root,
      quality: args.quality,
      fromDeg: args.fromDeg,
      toDeg: args.toDeg,
      reactionTimeMs: args.reactionTimeMs,
      redo: false,
      timestamp: Date.now(),
    });
  },
});

export const logProgressionEvent = mutation({
  args: {
    progression: v.string(),
    key: v.string(),
    stepLabel: v.string(),
    chord: v.string(),
    reactionTimeMs: v.number(),
  },
  returns: v.id("practiceEvents"),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    return await ctx.db.insert("practiceEvents", {
      userId,
      tool: "progression",
      chord: args.chord,
      progression: args.progression,
      key: args.key,
      stepLabel: args.stepLabel,
      reactionTimeMs: args.reactionTimeMs,
      redo: false,
      timestamp: Date.now(),
    });
  },
});

// --------------------------------------------------------------------------
// Generic mutations (used by custom drills / workshop)
// --------------------------------------------------------------------------

export const logPracticeEvent = mutation({
  args: {
    tool: v.string(),
    chord: v.optional(v.string()),
    fromDeg: v.optional(v.string()),
    toDeg: v.optional(v.string()),
    root: v.optional(v.string()),
    quality: v.optional(v.string()),
    mode: v.optional(v.string()),
    progression: v.optional(v.string()),
    key: v.optional(v.string()),
    stepLabel: v.optional(v.string()),
    reactionTimeMs: v.number(),
    grade: v.optional(v.string()),
    redo: v.boolean(),
    pageId: v.optional(v.string()),
  },
  returns: v.id("practiceEvents"),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    return await ctx.db.insert("practiceEvents", {
      ...args,
      timestamp: Date.now(),
      userId,
    });
  },
});

export const logMissEvent = mutation({
  args: {
    tool: v.string(),
    chord: v.string(),
    fromDeg: v.optional(v.string()),
    toDeg: v.optional(v.string()),
    played: v.string(),
    pageId: v.optional(v.string()),
  },
  returns: v.id("missEvents"),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    return await ctx.db.insert("missEvents", {
      ...args,
      timestamp: Date.now(),
      userId,
      fromDeg: args.fromDeg ?? "",
      toDeg: args.toDeg ?? "",
    });
  },
});

export const clearPracticeEventsByPage = mutation({
  args: { tool: v.string(), pageId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);

    while (true) {
      const events = await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) =>
          q.eq("userId", userId).eq("tool", args.tool)
        )
        // eslint-disable-next-line convex/no-filter-in-query
        .filter((q) => q.eq(q.field("pageId"), args.pageId))
        .take(CLEAR_BATCH_SIZE);
      if (events.length === 0) break;
      await Promise.all(
        events.map((event) => ctx.db.delete("practiceEvents", event._id))
      );
      if (events.length < CLEAR_BATCH_SIZE) break;
    }

    while (true) {
      const misses = await ctx.db
        .query("missEvents")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        // eslint-disable-next-line convex/no-filter-in-query
        .filter((q) =>
          q.and(q.eq(q.field("tool"), args.tool), q.eq(q.field("pageId"), args.pageId))
        )
        .take(CLEAR_BATCH_SIZE);
      if (misses.length === 0) break;
      await Promise.all(
        misses.map((miss) => ctx.db.delete("missEvents", miss._id))
      );
      if (misses.length < CLEAR_BATCH_SIZE) break;
    }
  },
});

// --------------------------------------------------------------------------
// Mutations - clear logs
// --------------------------------------------------------------------------

const CLEAR_BATCH_SIZE = 1000;

export const clearChordDrillEventsByChord = mutation({
  args: { chord: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);

    while (true) {
      const events = await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_chord", (q) =>
          q.eq("userId", userId).eq("chord", args.chord)
        )
        .take(CLEAR_BATCH_SIZE);
      const toDelete = events.filter((event) => event.tool === "chord-drill");
      if (toDelete.length === 0) break;
      await Promise.all(
        toDelete.map((event) => ctx.db.delete("practiceEvents", event._id))
      );
      if (events.length < CLEAR_BATCH_SIZE) break;
    }
  },
});

export const clearArpeggioEventsByTransition = mutation({
  args: {
    chord: v.string(),
    fromDeg: v.string(),
    toDeg: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);

    while (true) {
      const events = await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) =>
          q.eq("userId", userId).eq("tool", "arpeggios")
        )
        // eslint-disable-next-line convex/no-filter-in-query
        .filter((q) =>
          q.and(
            q.eq(q.field("chord"), args.chord),
            q.eq(q.field("fromDeg"), args.fromDeg),
            q.eq(q.field("toDeg"), args.toDeg)
          )
        )
        .take(CLEAR_BATCH_SIZE);
      if (events.length === 0) break;
      await Promise.all(
        events.map((event) => ctx.db.delete("practiceEvents", event._id))
      );
      if (events.length < CLEAR_BATCH_SIZE) break;
    }

    while (true) {
      const misses = await ctx.db
        .query("missEvents")
        .withIndex("by_user_transition", (q) =>
          q
            .eq("userId", userId)
            .eq("chord", args.chord)
            .eq("fromDeg", args.fromDeg)
            .eq("toDeg", args.toDeg)
        )
        .take(CLEAR_BATCH_SIZE);
      if (misses.length === 0) break;
      await Promise.all(
        misses.map((miss) => ctx.db.delete("missEvents", miss._id))
      );
      if (misses.length < CLEAR_BATCH_SIZE) break;
    }
  },
});

export const clearRootCycleEventsByGroup = mutation({
  args: {
    mode: v.string(),
    quality: v.optional(v.string()),
    fromDeg: v.optional(v.string()),
    toDeg: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);

    while (true) {
      const events = await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) =>
          q.eq("userId", userId).eq("tool", "root-cycling")
        )
        // eslint-disable-next-line convex/no-filter-in-query
        .filter((q) => {
          const filters = [q.eq(q.field("mode"), args.mode)];
          if (args.quality) filters.push(q.eq(q.field("quality"), args.quality));
          if (args.fromDeg) filters.push(q.eq(q.field("fromDeg"), args.fromDeg));
          if (args.toDeg) filters.push(q.eq(q.field("toDeg"), args.toDeg));
          return q.and(...filters);
        })
        .take(CLEAR_BATCH_SIZE);
      if (events.length === 0) break;
      await Promise.all(
        events.map((event) => ctx.db.delete("practiceEvents", event._id))
      );
      if (events.length < CLEAR_BATCH_SIZE) break;
    }
  },
});

export const clearProgressionEventsByProgression = mutation({
  args: {
    progression: v.string(),
    key: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);

    while (true) {
      const events = await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) =>
          q.eq("userId", userId).eq("tool", "progression")
        )
        // eslint-disable-next-line convex/no-filter-in-query
        .filter((q) =>
          q.and(
            q.eq(q.field("progression"), args.progression),
            q.eq(q.field("key"), args.key)
          )
        )
        .take(CLEAR_BATCH_SIZE);
      if (events.length === 0) break;
      await Promise.all(
        events.map((event) => ctx.db.delete("practiceEvents", event._id))
      );
      if (events.length < CLEAR_BATCH_SIZE) break;
    }
  },
});

// --------------------------------------------------------------------------
// Bulk import from legacy localStorage
// --------------------------------------------------------------------------

export const bulkImportTracking = mutation({
  args: {
    chordDrillEvents: v.array(
      v.object({
        chord: v.string(),
        reactionTimeMs: v.number(),
        grade: v.optional(v.string()),
        redo: v.boolean(),
        timestamp: v.number(),
      })
    ),
    arpeggioEvents: v.array(
      v.object({
        chord: v.string(),
        fromDeg: v.string(),
        toDeg: v.string(),
        reactionTimeMs: v.number(),
        timestamp: v.number(),
      })
    ),
    arpeggioMissEvents: v.array(
      v.object({
        chord: v.string(),
        fromDeg: v.string(),
        toDeg: v.string(),
        played: v.string(),
        timestamp: v.number(),
      })
    ),
    rootCycleEvents: v.array(
      v.object({
        mode: v.string(),
        label: v.optional(v.string()),
        root: v.optional(v.string()),
        quality: v.optional(v.string()),
        fromDeg: v.optional(v.string()),
        toDeg: v.optional(v.string()),
        reactionTimeMs: v.number(),
        timestamp: v.number(),
      })
    ),
  },
  returns: v.object({
    chordDrillCount: v.number(),
    arpeggioCount: v.number(),
    arpeggioMissCount: v.number(),
    rootCycleCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);

    for (const e of args.chordDrillEvents) {
      await ctx.db.insert("practiceEvents", {
        userId,
        tool: "chord-drill",
        chord: e.chord,
        reactionTimeMs: e.reactionTimeMs,
        grade: e.grade,
        redo: e.redo,
        timestamp: e.timestamp,
      });
    }

    for (const e of args.arpeggioEvents) {
      await ctx.db.insert("practiceEvents", {
        userId,
        tool: "arpeggios",
        chord: e.chord,
        fromDeg: e.fromDeg,
        toDeg: e.toDeg,
        reactionTimeMs: e.reactionTimeMs,
        redo: false,
        timestamp: e.timestamp,
      });
    }

    for (const e of args.arpeggioMissEvents) {
      await ctx.db.insert("missEvents", {
        userId,
        tool: "arpeggios",
        chord: e.chord,
        fromDeg: e.fromDeg,
        toDeg: e.toDeg,
        played: e.played,
        timestamp: e.timestamp,
      });
    }

    for (const e of args.rootCycleEvents) {
      await ctx.db.insert("practiceEvents", {
        userId,
        tool: "root-cycling",
        mode: e.mode,
        chord: e.mode === "arpeggio" ? undefined : e.label,
        root: e.root,
        quality: e.quality,
        fromDeg: e.fromDeg,
        toDeg: e.toDeg,
        reactionTimeMs: e.reactionTimeMs,
        redo: false,
        timestamp: e.timestamp,
      });
    }

    return {
      chordDrillCount: args.chordDrillEvents.length,
      arpeggioCount: args.arpeggioEvents.length,
      arpeggioMissCount: args.arpeggioMissEvents.length,
      rootCycleCount: args.rootCycleEvents.length,
    };
  },
});
