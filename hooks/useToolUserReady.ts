"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthAccess } from "@/hooks/useAuthAccess";

/**
 * Ensures the Convex user row exists when signed in, and reports when a tool
 * page may render. When auth is disabled (local-only), ready is immediate.
 */
export function useToolUserReady() {
  const { canAccess, canPersist, authDisabled, isSignedIn } = useAuthAccess();
  const [ensured, setEnsured] = useState(false);
  const ensureUser = useMutation(api.users.ensureCurrentUser);

  useEffect(() => {
    if (!canAccess || !canPersist) {
      return;
    }

    let cancelled = false;
    ensureUser()
      .then(() => {
        if (!cancelled) setEnsured(true);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setEnsured(true);
      });

    return () => {
      cancelled = true;
    };
  }, [canAccess, canPersist, ensureUser]);

  const userReady = canAccess && (!canPersist || ensured);

  return {
    canAccess,
    canPersist,
    authDisabled,
    isSignedIn,
    userReady,
  };
}
