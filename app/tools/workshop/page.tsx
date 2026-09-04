"use client";

import { DrillShell } from "@/components/drills/drill-shell";
import { PracticePageEditor } from "@/components/custom-practice/practice-page-editor";
import { useToolUserReady } from "@/hooks/useToolUserReady";

export default function WorkshopPage() {
  const { canPersist, userReady } = useToolUserReady();

  return (
    <DrillShell
      wide
      title="Workshop"
      subtitle="Your practice page is a grid — drag, resize, and make it yours."
    >
      {/* Only a Pro user waiting on their Convex row must wait — signed-out
          and Free users keep no server state, so they render immediately. */}
      {canPersist && !userReady ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading your account…
        </div>
      ) : (
        <PracticePageEditor />
      )}
    </DrillShell>
  );
}
