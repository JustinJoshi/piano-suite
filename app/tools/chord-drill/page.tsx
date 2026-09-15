"use client";

import { DrillGate } from "@/components/drills/drill-gate";
import { DrillShell } from "@/components/drills/drill-shell";
import { ChordDrill } from "@/components/drills/chord-drill/chord-drill";
import { ToolDemoVideo } from "@/components/drills/tool-demo-video";
import { useToolUserReady } from "@/hooks/useToolUserReady";

export default function ChordDrillPage() {
  const { canAccess, userReady } = useToolUserReady();

  return (
    <DrillShell
      title="Chord Drill"
      subtitle="Blocked-practice chord drill with timer, stats, and AnkiConnect integration."
    >
      {!canAccess ? (
        <DrillGate state="signed-out" message="Sign in to save your chord drill progress." />
      ) : !userReady ? (
        <DrillGate state="loading" message="Sign in to save your chord drill progress." />
      ) : (
        <ChordDrill />
      )}
      <ToolDemoVideo href="/tools/chord-drill" />
    </DrillShell>
  );
}
