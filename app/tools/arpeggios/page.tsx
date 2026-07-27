"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DrillShell } from "@/components/drills/drill-shell";
import { Arpeggios } from "@/components/drills/arpeggios/arpeggios";

export default function ArpeggiosPage() {
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
      title="Arpeggios"
      subtitle="Practice 7-note minor-11 arpeggio cells with two-phase root and sequence drilling."
    >
      {!isSignedIn ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sign in to save your arpeggio progress.
        </div>
      ) : !userReady ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading your settings…
        </div>
      ) : (
        <Arpeggios />
      )}
    </DrillShell>
  );
}
