import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ensureUserId } from "./lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmed)) {
    throw new Error("Invalid email address");
  }
  return trimmed;
}

export const joinWaitlist = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
  },
  returns: v.object({
    status: v.union(v.literal("joined"), v.literal("alreadyJoined")),
    position: v.number(),
  }),
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);

    const existing = await ctx.db
      .query("waitlistSignups")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      return { status: "alreadyJoined" as const, position: existing.position };
    }

    // Anonymous visitors are allowed by design; attach the users row only
    // when a Clerk identity is actually present.
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity ? await ensureUserId(ctx) : undefined;

    const position =
      (await ctx.db.query("waitlistSignups").collect()).length + 1;

    await ctx.db.insert("waitlistSignups", {
      email,
      userId,
      position,
      source: args.source,
      createdAt: Date.now(),
    });

    return { status: "joined" as const, position };
  },
});

export const waitlistCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    return (await ctx.db.query("waitlistSignups").collect()).length;
  },
});

export const waitlistSignupByEmail = query({
  args: { email: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.optional(v.id("users")),
      position: v.number(),
      source: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);

    const row = await ctx.db
      .query("waitlistSignups")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!row) {
      return null;
    }

    return {
      userId: row.userId,
      position: row.position,
      source: row.source,
    };
  },
});
