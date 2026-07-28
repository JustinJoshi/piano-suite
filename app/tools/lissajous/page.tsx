import { LissajousLab } from "@/components/drills/lissajous/lissajous-lab";
import { DrillShell } from "@/components/drills/drill-shell";

export default function LissajousPage() {
  return (
    <DrillShell
      title="Lissajous Harmonic Lab"
      subtitle="Explore frequency-ratio curves that map to musical intervals."
    >
      <LissajousLab />
    </DrillShell>
  );
}
