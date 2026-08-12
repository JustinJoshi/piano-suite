import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Signed-in user's Convex id, or null when there is no Clerk identity or no
 * `users` row yet. Use in queries that must not crash the React tree.
 */
export async function optionalUserId(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  return user?._id ?? null;
}

/**
 * Like `optionalUserId`, but throws for mutations that require a session.
 */
export async function requireUserId(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const userId = await optionalUserId(ctx);
  if (!userId) {
    throw new Error("User not found");
  }

  return userId;
}

type ClerkIdentity = NonNullable<
  Awaited<ReturnType<MutationCtx["auth"]["getUserIdentity"]>>
>;

async function syncUserProfile(
  ctx: MutationCtx,
  existing: {
    _id: Id<"users">;
    email?: string | null;
    name?: string | null;
    imageUrl?: string | null;
  },
  identity: ClerkIdentity
) {
  if (
    existing.email !== identity.email ||
    existing.name !== identity.name ||
    existing.imageUrl !== identity.pictureUrl
  ) {
    await ctx.db.patch("users", existing._id, {
      email: identity.email,
      name: identity.name,
      imageUrl: identity.pictureUrl,
    });
  }
}

/**
 * Returns the Convex user id, creating the row on first sign-in. Use in
 * mutations so writes never race `ensureCurrentUser` on the client.
 */
export async function ensureUserId(ctx: MutationCtx): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (existing) {
    await syncUserProfile(ctx, existing, identity);
    return existing._id;
  }

  return await ctx.db.insert("users", {
    clerkId: identity.subject,
    email: identity.email,
    name: identity.name,
    imageUrl: identity.pictureUrl,
    createdAt: Date.now(),
  });
}
