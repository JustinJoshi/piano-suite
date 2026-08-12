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
      syncEntitled: v.optional(v.boolean()),
      entitlementSource: v.optional(v.string()),
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

/**
 * Set/clear the webhook-mirrored Pro sync entitlement on a user row.
 *
 * SECURITY: the ONLY auth here is the `CLERK_WEBHOOK_SHARED_SECRET` shared
 * between the svix-verified Next.js webhook route
 * (`app/api/webhooks/clerk/route.ts`) and Convex. Never call this from a
 * client; the secret must only exist in server-side env vars
 * (Vercel + `npx convex env set`).
 *
 * Returns null (no-op) when no `users` row exists for the clerkId yet — the
 * row may not have been bootstrapped, and the entitlement gate also reads
 * JWT claims, so skipping is safe.
 */
export const applyWebhookEntitlement = mutation({
  args: {
    clerkId: v.string(),
    entitled: v.boolean(),
    secret: v.string(),
  },
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx, args) => {
    if (args.secret !== process.env.CLERK_WEBHOOK_SHARED_SECRET) {
      throw new Error("Invalid webhook secret");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) {
      return null;
    }
    await ctx.db.patch("users", user._id, {
      syncEntitled: args.entitled,
      entitlementSource: "webhook",
    });
    return user._id;
  },
});

/**
 * Mirror Clerk `user.updated` profile fields (email/name/imageUrl) onto the
 * user row. Same shared-secret-only auth as `applyWebhookEntitlement`;
 * no-op when the row does not exist yet (mutation-driven `syncUserProfile`
 * in `ensureUserId` keeps covering signed-in sessions).
 */
export const applyWebhookProfile = mutation({
  args: {
    clerkId: v.string(),
    secret: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx, args) => {
    if (args.secret !== process.env.CLERK_WEBHOOK_SHARED_SECRET) {
      throw new Error("Invalid webhook secret");
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    if (!user) {
      return null;
    }
    const patch: {
      email?: string;
      name?: string;
      imageUrl?: string;
    } = {};
    if (args.email !== undefined) patch.email = args.email;
    if (args.name !== undefined) patch.name = args.name;
    if (args.imageUrl !== undefined) patch.imageUrl = args.imageUrl;
    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("users", user._id, patch);
    }
    return user._id;
  },
});
