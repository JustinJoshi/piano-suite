"use client";

import { DrillShell } from "@/components/drills/drill-shell";
import { Arpeggios } from "@/components/drills/arpeggios/arpeggios";
import { useToolUserReady } from "@/hooks/useToolUserReady";

export default function ArpeggiosPage() {
  const { canAccess, userReady } = useToolUserReady();

  return (
    <DrillShell
      title="Arpeggios"
      subtitle="Practice 7-note minor-11 arpeggio cells with two-phase root and sequence drilling."
    >
      {!canAccess ? (
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
