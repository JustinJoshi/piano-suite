"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DrillShell } from "@/components/drills/drill-shell";
import { RootCycling } from "@/components/drills/root-cycling/root-cycling";

export default function RootCyclingPage() {
  const [userReady, setUserReady] = useState(false);
  const { isSignedIn } = useUser();
  const ensureUser = useMutation(api.users.ensureCurrentUser);

  useEffect(() => {
    if (isSignedIn) {
      ensureUser()
        .then(() => setUserReady(true))
        .catch((err) => {
          console.error(err);
          setUserReady(true);
        });
    }
  }, [isSignedIn, ensureUser]);

  return (
    <DrillShell
      title="Root Cycling"
      subtitle="Drill one fixed chord or arpeggio idea across random roots in all 12 keys."
    >
      {!isSignedIn ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sign in to save your root cycling progress.
        </div>
      ) : !userReady ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading your settings…
        </div>
      ) : (
        <RootCycling />
      )}
    </DrillShell>
  );
}
