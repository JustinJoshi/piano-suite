"use client";

import { DrillShell } from "@/components/drills/drill-shell";
import { PracticePageEditor } from "@/components/custom-practice/practice-page-editor";
import { useToolUserReady } from "@/hooks/useToolUserReady";

export default function WorkshopPage() {
  const { canAccess, userReady } = useToolUserReady();

  return (
    <DrillShell
      title="Workshop"
      subtitle="Build your own practice page from reusable features."
    >
      {!canAccess ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sign in to create custom practice pages.
        </div>
      ) : !userReady ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading your account…
        </div>
      ) : (
        <PracticePageEditor />
      )}
    </DrillShell>
  );
}
