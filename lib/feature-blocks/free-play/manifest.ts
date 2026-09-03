import type { ComponentManifest } from "../manifest-types";
import { freePlayFields } from "./config";

export const freePlayManifest: ComponentManifest = {
  type: "freePlay",
  kind: "interactive",
  label: "Free play scope",
  summary:
    "No targets, no grading: a live readout of what you play — in-scale share, density, range, and note spread.",
  justification:
    "Improvisation has no misses. If the runtime's only vocabulary is target/hit/miss, the creativity pillar of practice has no representation; this block characterizes playing instead of grading it and is the cheapest of the runtime modes.",
  category: "visualization",
  accepts: [],
  outputs: [],
  requires: [],
  configSpec: freePlayFields,
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  docsPath: "docs/components/free-play.md",
  status: "experimental",
};
