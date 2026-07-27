"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DrillShell } from "@/components/drills/drill-shell";
import { ChordDrill } from "@/components/drills/chord-drill/chord-drill";

export default function ChordDrillPage() {
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
      title="Chord Drill"
      subtitle="Blocked-practice chord drill with timer, stats, and AnkiConnect integration."
    >
      {!isSignedIn ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sign in to save your chord drill progress.
        </div>
      ) : !userReady ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading your settings…
        </div>
      ) : (
        <ChordDrill />
      )}
    </DrillShell>
  );
}
