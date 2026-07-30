import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { optionalUserId } from "./lib/auth";
import { ensureUserIdWithSync } from "./lib/entitlements";

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
  args: {},
  handler: async (ctx) => {
    return await listEventsForUserOrEmpty(ctx, async (userId) =>
      await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) => q.eq("userId", userId).eq("tool", "chord-drill"))
        .collect()
    );
  },
});

export const listArpeggioEvents = query({
  args: {},
  handler: async (ctx) => {
    return await listEventsForUserOrEmpty(ctx, async (userId) =>
      await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) => q.eq("userId", userId).eq("tool", "arpeggios"))
        .collect()
    );
  },
});

export const listArpeggioMissEvents = query({
  args: {},
  handler: async (ctx) => {
    return await listEventsForUserOrEmpty(ctx, async (userId) =>
      await ctx.db
        .query("missEvents")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    );
  },
});

export const listRootCycleEvents = query({
  args: {},
  handler: async (ctx) => {
    return await listEventsForUserOrEmpty(ctx, async (userId) =>
      await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) => q.eq("userId", userId).eq("tool", "root-cycling"))
        .collect()
    );
  },
});

export const listProgressionEvents = query({
  args: {},
  handler: async (ctx) => {
    return await listEventsForUserOrEmpty(ctx, async (userId) =>
      await ctx.db
        .query("practiceEvents")
        .withIndex("by_user_tool", (q) => q.eq("userId", userId).eq("tool", "progression"))
        .collect()
    );
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
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== userId || event.tool !== "chord-drill") {
      throw new Error("Event not found");
    }
    await ctx.db.patch(args.eventId, { grade: args.grade });
  },
});

export const logArpeggioTransition = mutation({
  args: {
    chord: v.string(),
    fromDeg: v.string(),
    toDeg: v.string(),
    reactionTimeMs: v.number(),
  },
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
// Mutations - clear logs
// --------------------------------------------------------------------------

export const clearChordDrillEventsByChord = mutation({
  args: { chord: v.string() },
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    const events = await ctx.db
      .query("practiceEvents")
      .withIndex("by_user_chord", (q) => q.eq("userId", userId).eq("chord", args.chord))
      .collect();
    for (const event of events) {
      if (event.tool === "chord-drill") {
        await ctx.db.delete(event._id);
      }
    }
  },
});

export const clearArpeggioEventsByTransition = mutation({
  args: {
    chord: v.string(),
    fromDeg: v.string(),
    toDeg: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    const events = await ctx.db
      .query("practiceEvents")
      .withIndex("by_user_tool", (q) => q.eq("userId", userId).eq("tool", "arpeggios"))
      .filter((q) =>
        q.and(
          q.eq(q.field("chord"), args.chord),
          q.eq(q.field("fromDeg"), args.fromDeg),
          q.eq(q.field("toDeg"), args.toDeg)
        )
      )
      .collect();
    const misses = await ctx.db
      .query("missEvents")
      .withIndex("by_user_transition", (q) =>
        q.eq("userId", userId).eq("chord", args.chord).eq("fromDeg", args.fromDeg).eq("toDeg", args.toDeg)
      )
      .collect();
    for (const event of events) await ctx.db.delete(event._id);
    for (const miss of misses) await ctx.db.delete(miss._id);
  },
});

export const clearRootCycleEventsByGroup = mutation({
  args: {
    mode: v.string(),
    quality: v.optional(v.string()),
    fromDeg: v.optional(v.string()),
    toDeg: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    const events = await ctx.db
      .query("practiceEvents")
      .withIndex("by_user_tool", (q) => q.eq("userId", userId).eq("tool", "root-cycling"))
      .filter((q) => {
        const filters = [q.eq(q.field("mode"), args.mode)];
        if (args.quality) filters.push(q.eq(q.field("quality"), args.quality));
        if (args.fromDeg) filters.push(q.eq(q.field("fromDeg"), args.fromDeg));
        if (args.toDeg) filters.push(q.eq(q.field("toDeg"), args.toDeg));
        return q.and(...filters);
      })
      .collect();
    for (const event of events) await ctx.db.delete(event._id);
  },
});

export const clearProgressionEventsByProgression = mutation({
  args: {
    progression: v.string(),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ensureUserIdWithSync(ctx);
    const events = await ctx.db
      .query("practiceEvents")
      .withIndex("by_user_tool", (q) => q.eq("userId", userId).eq("tool", "progression"))
      .filter((q) =>
        q.and(
          q.eq(q.field("progression"), args.progression),
          q.eq(q.field("key"), args.key)
        )
      )
      .collect();
    for (const event of events) await ctx.db.delete(event._id);
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
