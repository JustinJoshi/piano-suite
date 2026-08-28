import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    // Pro/sync entitlement mirrored from Clerk Billing webhooks. Mutations
    // gate on JWT `pla`/`fea` claims OR this column (see
    // convex/lib/entitlements.ts); the webhook is the robust path because
    // claims delivery depends on Clerk session-token configuration.
    syncEntitled: v.optional(v.boolean()),
    // Who last set `syncEntitled` (e.g. "webhook").
    entitlementSource: v.optional(v.string()),
  })
    .index("by_clerkId", ["clerkId"]),

  // Timing events from the Reflex Drill EXT tracking tab:
  // chord-drill first-chord times, arpeggio transitions, root-cycling attempts,
  // and progression drill step transitions.
  practiceEvents: defineTable({
    userId: v.id("users"),
    tool: v.string(), // "chord-drill" | "arpeggios" | "root-cycling" | "progression"
    chord: v.optional(v.string()),
    fromDeg: v.optional(v.string()),
    toDeg: v.optional(v.string()),
    root: v.optional(v.string()),
    quality: v.optional(v.string()),
    mode: v.optional(v.string()), // "chord" | "arpeggio" for root-cycling
    progression: v.optional(v.string()), // e.g. "ii-V-I" | "blues12"
    key: v.optional(v.string()), // progression key, e.g. "C"
    stepLabel: v.optional(v.string()), // e.g. "ii" | "bar 5"
    reactionTimeMs: v.number(),
    grade: v.optional(v.string()), // Again | Hard | Good | Easy
    redo: v.boolean(),
    timestamp: v.number(),
    pageId: v.optional(v.string()), // custom-drill page id when tool === "workshop"
  })
    .index("by_user_tool", ["userId", "tool"])
    .index("by_user_chord", ["userId", "chord"]),

  // Daily technique habit sessions (exercise name, BPM, notes).
  techniqueSessions: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD (UTC)
    exercise: v.string(),
    bpm: v.number(),
    notes: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"]),

  // Wrong-note events from the Arpeggios drill.
  missEvents: defineTable({
    userId: v.id("users"),
    tool: v.string(), // "arpeggios"
    chord: v.string(),
    fromDeg: v.string(),
    toDeg: v.string(),
    played: v.string(),
    timestamp: v.number(),
    pageId: v.optional(v.string()), // custom-drill page id when tool === "workshop"
  })
    .index("by_user", ["userId"])
    .index("by_user_tool", ["userId", "tool"])
    .index("by_user_transition", ["userId", "chord", "fromDeg", "toDeg"]),

  settings: defineTable({
    userId: v.id("users"),
    key: v.string(),
    value: v.any(),
  })
    .index("by_user_key", ["userId", "key"]),

  // Named parameter snapshots from pattern labs (Chladni, Julia, Lissajous, …).
  savedPatterns: defineTable({
    userId: v.id("users"),
    tool: v.string(), // "chladni" | "julia" | "lissajous"
    name: v.string(),
    params: v.any(), // lab-specific JSON snapshot
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_tool", ["userId", "tool"]),

  // Workshop custom practice pages (Pro sync; Free keeps pages in localStorage).
  // `clientPageId` is generated on the client and is the stable sync key.
  // Deleted pages become tombstones (deleted=true) so deletions propagate to
  // other devices instead of being resurrected by stale local copies.
  customDrills: defineTable({
    ownerId: v.id("users"),
    clientPageId: v.string(),
    title: v.string(),
    blocks: v.array(v.any()), // envelope-validated in convex/workshop.ts
    deleted: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    forkedFrom: v.optional(v.id("customDrills")),
    authorName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_client_id", ["ownerId", "clientPageId"])
    .index("by_public", ["isPublic"]),

  // Founding Pro waitlist (pre-launch; billing is disabled until launch).
  // Anonymous signups allowed by design — the value moment happens before
  // any auth wall. Dedupe key is the normalized email.
  waitlistSignups: defineTable({
    email: v.string(),
    userId: v.optional(v.id("users")),
    position: v.number(),
    source: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_position", ["position"]),
});
