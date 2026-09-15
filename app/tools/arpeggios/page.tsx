"use client";

import { DrillGate } from "@/components/drills/drill-gate";
import { DrillShell } from "@/components/drills/drill-shell";
import { Arpeggios } from "@/components/drills/arpeggios/arpeggios";
import { ToolDemoVideo } from "@/components/drills/tool-demo-video";
import { useToolUserReady } from "@/hooks/useToolUserReady";

export default function ArpeggiosPage() {
  const { canAccess, userReady } = useToolUserReady();

  return (
    <DrillShell
      title="Arpeggios"
      subtitle="Practice 7-note minor-11 arpeggio cells with two-phase root and sequence drilling."
    >
      {!canAccess ? (
        <DrillGate state="signed-out" message="Sign in to save your arpeggio progress." />
      ) : !userReady ? (
        <DrillGate state="loading" message="Sign in to save your arpeggio progress." />
      ) : (
        <Arpeggios />
      )}
      <ToolDemoVideo href="/tools/arpeggios" />
    </DrillShell>
  );
}
