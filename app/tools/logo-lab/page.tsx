import { LogoLab } from "@/components/drills/logo-lab/logo-lab";
import { DrillShell } from "@/components/drills/drill-shell";

export default function LogoLabPage() {
  return (
    <DrillShell
      title="Logo Lab"
      subtitle="Design a Chladni brand mark, then Apply to update the app logo."
    >
      <LogoLab />
    </DrillShell>
  );
}
