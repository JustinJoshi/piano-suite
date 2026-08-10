import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { hasSyncFromClerkClaims } from "../../lib/billing";
import { ensureUserId } from "./auth";

/**
 * Ensure the Convex user row exists and the caller has Pro sync entitlement.
 *
 * Entitlement is accepted from EITHER source:
 * 1. Clerk Billing claims in the session JWT (`pla` / `fea`), or
 * 2. the webhook-mirrored `syncEntitled` column on the `users` row (set by
 *    `users.applyWebhookEntitlement` from Clerk Billing webhooks).
 *
 * The webhook mirror exists because whether Billing claims reach
 * `ctx.auth.getUserIdentity()` depends on Clerk session-token configuration
 * and fails silently — paid Pro users must never be rejected. Free signed-in
 * users can still call queries (soft empty); mutations that persist practice
 * history, technique sessions, or settings (theme/atmosphere/hero) must use
 * this helper. Free prefs stay in localStorage (WP6).
 */
export async function ensureUserIdWithSync(
  ctx: MutationCtx
): Promise<Id<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  // UserIdentity exposes standard OIDC fields plus custom JWT claims.
  const claims = identity as unknown as Record<string, unknown>;

  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (hasSyncFromClerkClaims(claims) || existing?.syncEntitled === true) {
    return await ensureUserId(ctx);
  }

  throw new Error(
    "Pro required to sync across devices. Upgrade at /pricing."
  );
}
