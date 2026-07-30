import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { hasSyncFromClerkClaims } from "../../lib/billing";
import { ensureUserId } from "./auth";

/**
 * Ensure the Convex user row exists and the caller has Pro sync entitlement.
 *
 * Reads Clerk Billing claims from the session JWT (`pla` / `fea`). Free
 * signed-in users can still call queries (soft empty); mutations that persist
 * practice history, technique sessions, or settings (theme/atmosphere/hero)
 * must use this helper. Free prefs stay in localStorage (WP6).
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
  if (!hasSyncFromClerkClaims(claims)) {
    throw new Error(
      "Pro required to sync across devices. Upgrade at /pricing."
    );
  }

  return await ensureUserId(ctx);
}
