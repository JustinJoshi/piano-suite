"use client";

import { DrillShell } from "@/components/drills/drill-shell";
import { RootCycling } from "@/components/drills/root-cycling/root-cycling";
import { ToolDemoVideo } from "@/components/drills/tool-demo-video";
import { useToolUserReady } from "@/hooks/useToolUserReady";

export default function RootCyclingPage() {
  const { canAccess, userReady } = useToolUserReady();

  return (
    <DrillShell
      title="Root Cycling"
      subtitle="Drill one fixed chord or arpeggio idea across random roots in all 12 keys."
    >
      {!canAccess ? (
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
      <ToolDemoVideo href="/tools/root-cycling" />
    </DrillShell>
  );
}
