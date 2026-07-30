import { MultigridLab } from "@/components/drills/multigrid/multigrid-lab";
import { DrillShell } from "@/components/drills/drill-shell";

export default function MultigridPage() {
  return (
    <DrillShell
      title="Multigrid Lab"
      subtitle="Explore de Bruijn multigrid dual tilings — geometric grids that unfold into colored rhombus patterns."
    >
      <MultigridLab />
    </DrillShell>
  );
}
