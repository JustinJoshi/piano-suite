import type { ComponentManifest } from "../manifest-types";
import { targetDisplayFields } from "./config";

export const targetDisplayManifest: ComponentManifest = {
  type: "targetDisplay",
  kind: "interactive",
  label: "Target display",
  summary: "Show what to play right now.",
  justification:
    "Generalizes the display half of chord set, scale runner, root cycle, and progression blocks. Users can compose any source with one display instead of recreating blocks.",
  category: "technique",
  accepts: ["practiceNotes"],
  outputs: [],
  requires: [],
  configSpec: targetDisplayFields,
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 1, h: 1 },
  docsPath: "docs/components/target-display.md",
  // Wired to the page stream in phase 2.0, but new enough that its shape
  // may still change.
  status: "experimental",
};
