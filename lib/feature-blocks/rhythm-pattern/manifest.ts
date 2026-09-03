import type { ComponentManifest } from "../manifest-types";
import { rhythmPatternFields } from "./config";

export const rhythmPatternManifest: ComponentManifest = {
  type: "rhythmPattern",
  kind: "transform",
  label: "Rhythm pattern",
  summary:
    "Places incoming notes on a per-hand onset grid and scales note length (staccato to legato).",
  justification:
    "Timing is a property applied to content, not content itself. Any source (scale, chords, a piece) becomes a rhythmic drill when passed through this transform, which is why it exists as one generic component instead of per-source rhythm variants.",
  category: "rhythm",
  accepts: ["practiceNotes"],
  outputs: ["practiceNotes"],
  requires: [],
  configSpec: rhythmPatternFields,
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 1 },
  docsPath: "docs/components/rhythm-pattern.md",
  status: "experimental",
};
