"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DrillShell } from "@/components/drills/drill-shell";
import { TechniqueTracker } from "@/components/drills/technique/technique-tracker";
import { ImportTechnique } from "@/components/drills/technique/import-technique";

export default function TechniquePage() {
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
      title="Technique"
      subtitle="Daily technique habit tracker with metronome, BPM log, and a 28-day grid."
    >
      {!isSignedIn ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sign in to track your technique practice.
        </div>
      ) : !userReady ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading your technique history…
        </div>
      ) : (
        <>
          <ImportTechnique />
          <TechniqueTracker />
        </>
      )}
    </DrillShell>
  );
}
