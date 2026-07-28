import { ChladniRippleLab } from "@/components/drills/chladni-ripple/chladni-ripple-lab";
import { DrillShell } from "@/components/drills/drill-shell";

export default function ChladniRipplePage() {
  return (
    <DrillShell
      title="Chladni Ripple"
      subtitle="Drive square-plate nodal patterns from the notes you play."
    >
      <ChladniRippleLab />
    </DrillShell>
  );
}
