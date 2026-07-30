"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { isAuthDisabled } from "@/lib/auth-disabled";
import {
  PRO_PLAN_SLUG,
  SYNC_FEATURE_SLUG,
  canPersistFromEntitlements,
} from "@/lib/billing";

/**
 * Unified auth gate for tool pages and drill components.
 *
 * - `canAccess`: open the tool UI (true when signed in, or when auth is disabled)
 * - `canPersist`: write practice history **and** theme/atmosphere prefs to
 *   Convex — Pro (`sync`) or AUTH_DISABLED
 *
 * Signed-in Free users keep drilling and prefs in the browser
 * (`lib/local-practice-history.ts` + localStorage). Convex mutations reject
 * Free JWTs via `ensureUserIdWithSync`.
 */
export function useAuthAccess() {
  const { isSignedIn } = useUser();
  const { isLoaded, has } = useAuth();
  const authDisabled = isAuthDisabled();
  const signedIn = !!isSignedIn;

  const hasSyncFeature =
    !!isLoaded && typeof has === "function"
      ? has({ feature: SYNC_FEATURE_SLUG })
      : false;
  const hasProPlan =
    !!isLoaded && typeof has === "function"
      ? has({ plan: PRO_PLAN_SLUG })
      : false;

  return {
    authDisabled,
    isSignedIn: signedIn,
    canAccess: authDisabled || signedIn,
    canPersist: canPersistFromEntitlements({
      authDisabled,
      hasSyncFeature,
      hasProPlan,
    }),
  };
}
