"use client";

import { DrillShell } from "@/components/drills/drill-shell";
import { ChordDrill } from "@/components/drills/chord-drill/chord-drill";
import { useToolUserReady } from "@/hooks/useToolUserReady";

export default function ChordDrillPage() {
  const { canAccess, userReady } = useToolUserReady();

  return (
    <DrillShell
      title="Chord Drill"
      subtitle="Blocked-practice chord drill with timer, stats, and AnkiConnect integration."
    >
      {!canAccess ? (
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
