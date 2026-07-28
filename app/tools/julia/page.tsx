import { JuliaLab } from "@/components/drills/julia/julia-lab";
import { DrillShell } from "@/components/drills/drill-shell";

export default function JuliaPage() {
  return (
    <DrillShell
      title="Julia Set Lab"
      subtitle="Explore escape-time Julia sets by adjusting the complex parameter c."
    >
      <JuliaLab />
    </DrillShell>
  );
}
