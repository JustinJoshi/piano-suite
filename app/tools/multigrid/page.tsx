"use client";

import Link from "next/link";
import { MultigridLab } from "@/components/drills/multigrid/multigrid-lab";
import { DrillShell } from "@/components/drills/drill-shell";
import { useExperimentalFeatures } from "@/hooks/useExperimentalFeatures";

export default function MultigridPage() {
  const { enabled: experimentalEnabled } = useExperimentalFeatures();

  return (
    <DrillShell
      title="Multigrid Lab"
      subtitle="Explore de Bruijn multigrid dual tilings — geometric grids that unfold into colored rhombus patterns."
    >
      {experimentalEnabled ? (
        <MultigridLab />
      ) : (
        <div
          className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground"
          data-testid="multigrid-experimental-gate"
        >
          Multigrid Lab is an experimental feature. Enable it under{" "}
          <Link
            href="/settings/theme"
            className="text-primary underline-offset-2 hover:underline"
          >
            Theme → Enable experimental features
          </Link>
          .
        </div>
      )}
    </DrillShell>
  );
}
