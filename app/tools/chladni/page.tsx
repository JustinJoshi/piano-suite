import { ChladniLab } from "@/components/drills/chladni/chladni-lab";
import { DrillShell } from "@/components/drills/drill-shell";

export default function ChladniPage() {
  return (
    <DrillShell
      title="Chladni Pattern Lab"
      subtitle="Explore square-plate nodal patterns by adjusting waveform parameters."
    >
      <ChladniLab />
    </DrillShell>
  );
}
