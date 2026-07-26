import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"]),

  // Timing events from the Reflex Drill EXT tracking tab:
  // chord-drill first-chord times, arpeggio transitions, root-cycling attempts.
  practiceEvents: defineTable({
    userId: v.id("users"),
    tool: v.string(), // "chord-drill" | "arpeggios" | "root-cycling"
    chord: v.optional(v.string()),
    fromDeg: v.optional(v.string()),
    toDeg: v.optional(v.string()),
    root: v.optional(v.string()),
    quality: v.optional(v.string()),
    mode: v.optional(v.string()), // "chord" | "arpeggio" for root-cycling
    reactionTimeMs: v.number(),
    grade: v.optional(v.string()), // Again | Hard | Good | Easy
    redo: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_tool", ["userId", "tool"])
    .index("by_user_chord", ["userId", "chord"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  // Wrong-note events from the Arpeggios drill.
  missEvents: defineTable({
    userId: v.id("users"),
    tool: v.string(), // "arpeggios"
    chord: v.string(),
    fromDeg: v.string(),
    toDeg: v.string(),
    played: v.string(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_transition", ["userId", "chord", "fromDeg", "toDeg"]),

  settings: defineTable({
    userId: v.id("users"),
    key: v.string(),
    value: v.any(),
  })
    .index("by_user_key", ["userId", "key"]),
});
