"use client";

import { DrillGate } from "@/components/drills/drill-gate";
import { DrillShell } from "@/components/drills/drill-shell";
import { Progression } from "@/components/drills/progression/progression";
import { ToolDemoVideo } from "@/components/drills/tool-demo-video";
import { useToolUserReady } from "@/hooks/useToolUserReady";

export default function ProgressionPage() {
  const { canAccess, userReady } = useToolUserReady();

  return (
    <DrillShell
      title="Progression"
      subtitle="Loop ii-V-I and 12-bar blues progressions with per-chord transition timing."
    >
      {!canAccess ? (
        <DrillGate state="signed-out" message="Sign in to save your progression progress." />
      ) : !userReady ? (
        <DrillGate state="loading" message="Sign in to save your progression progress." />
      ) : (
        <Progression />
      )}
      <ToolDemoVideo href="/tools/progression" />
    </DrillShell>
  );
}
