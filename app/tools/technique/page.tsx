"use client";

import { DrillShell } from "@/components/drills/drill-shell";
import { TechniqueTracker } from "@/components/drills/technique/technique-tracker";
import { ImportTechnique } from "@/components/drills/technique/import-technique";
import { useToolUserReady } from "@/hooks/useToolUserReady";

export default function TechniquePage() {
  const { canAccess, canPersist, userReady } = useToolUserReady();

  return (
    <DrillShell
      title="Technique"
      subtitle="Daily technique habit tracker with metronome, BPM log, and a 28-day grid."
    >
      {!canAccess ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sign in to track your technique practice.
        </div>
      ) : !userReady ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading your technique history…
        </div>
      ) : (
        <>
          <div className="flex-1">
            <TechniqueTracker />
          </div>
          {canPersist ? <ImportTechnique /> : null}
        </>
      )}
    </DrillShell>
  );
}
