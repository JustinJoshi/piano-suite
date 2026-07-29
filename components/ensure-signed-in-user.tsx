"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Ensures a Convex `users` row exists as soon as Clerk reports a session.
 *
 * Tool pages also call `ensureCurrentUser` via `useToolUserReady`; this
 * bootstrap covers homepage settings/theme sync that query Convex before
 * any tool page mounts.
 */
export function EnsureSignedInUser() {
  const { isSignedIn } = useUser();
  const ensureUser = useMutation(api.users.ensureCurrentUser);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    let cancelled = false;
    ensureUser().catch((err: unknown) => {
      if (!cancelled) {
        console.error(err);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, ensureUser]);

  return null;
}
