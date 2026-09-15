"use client";

import { DrillGate } from "@/components/drills/drill-gate";
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
        <DrillGate state="signed-out" message="Sign in to save your root cycling progress." />
      ) : !userReady ? (
        <DrillGate state="loading" message="Sign in to save your root cycling progress." />
      ) : (
        <RootCycling />
      )}
      <ToolDemoVideo href="/tools/root-cycling" />
    </DrillShell>
  );
}
