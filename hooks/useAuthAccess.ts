"use client";

import { useUser } from "@clerk/nextjs";
import { isAuthDisabled } from "@/lib/auth-disabled";

/**
 * Unified auth gate for tool pages and drill components.
 *
 * - `canAccess`: open the tool UI (true when signed in, or when auth is disabled)
 * - `canPersist`: talk to Convex with a real identity (signed in only)
 */
export function useAuthAccess() {
  const { isSignedIn } = useUser();
  const authDisabled = isAuthDisabled();
  const signedIn = !!isSignedIn;

  return {
    authDisabled,
    isSignedIn: signedIn,
    canAccess: authDisabled || signedIn,
    canPersist: signedIn,
  };
}
