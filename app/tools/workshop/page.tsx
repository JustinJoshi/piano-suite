"use client";

import { DrillShell } from "@/components/drills/drill-shell";
import { PracticePageEditor } from "@/components/custom-practice/practice-page-editor";

/**
 * Public on purpose: Free persistence is localStorage, so the editor works
 * without an account (`proxy.ts` allows this route; `useWorkshopSync` is a
 * no-op until the user can sync). Sign-in is offered by the sync badge,
 * not enforced here.
 */
export default function WorkshopPage() {
  return (
    <DrillShell
      wide
      title="Workshop"
      subtitle="Your practice page is a grid — drag, resize, and make it yours."
    >
      <PracticePageEditor />
    </DrillShell>
  );
}
