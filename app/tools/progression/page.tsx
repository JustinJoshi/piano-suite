"use client";

import { DrillShell } from "@/components/drills/drill-shell";
import { Progression } from "@/components/drills/progression/progression";
import { useToolUserReady } from "@/hooks/useToolUserReady";

export default function ProgressionPage() {
  const { canAccess, userReady } = useToolUserReady();

  return (
    <DrillShell
      title="Progression"
      subtitle="Loop ii-V-I and 12-bar blues progressions with per-chord transition timing."
    >
      {!canAccess ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sign in to save your progression progress.
        </div>
      ) : !userReady ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading your settings…
        </div>
      ) : (
        <Progression />
      )}
    </DrillShell>
  );
}
