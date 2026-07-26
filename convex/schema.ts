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

  practiceEvents: defineTable({
    userId: v.id("users"),
    tool: v.string(), // e.g. "chord-drill", "arpeggios", "root-cycling"
    chord: v.optional(v.string()),
    reactionTimeMs: v.optional(v.number()),
    grade: v.optional(v.string()), // Again | Hard | Good | Easy
    redo: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_tool", ["userId", "tool"])
    .index("by_user_timestamp", ["userId", "timestamp"]),

  settings: defineTable({
    userId: v.id("users"),
    key: v.string(),
    value: v.any(),
  })
    .index("by_user_key", ["userId", "key"]),
});
