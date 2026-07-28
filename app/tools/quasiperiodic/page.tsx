import { QuasiperiodicLab } from "@/components/drills/quasiperiodic/quasiperiodic-lab";
import { DrillShell } from "@/components/drills/drill-shell";

export default function QuasiperiodicPage() {
  return (
    <DrillShell
      title="Quasiperiodic Pattern Lab"
      subtitle="Explore N-fold wave interference fields that tile the plane with morphing nodal webs."
    >
      <QuasiperiodicLab />
    </DrillShell>
  );
}
