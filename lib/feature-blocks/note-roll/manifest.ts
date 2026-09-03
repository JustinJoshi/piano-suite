import type { ComponentManifest } from "../manifest-types";
import { noteRollFields } from "./config";

export const noteRollManifest: ComponentManifest = {
  type: "noteRoll",
  kind: "interactive",
  label: "Note roll",
  summary:
    "Synthesia-style falling notes over a hit line, with hand filter and scroll speed.",
  justification:
    "A continuous time-scrolling view is a different visual language from one-target-at-a-time displays: pieces and rhythm drills read better as a roll. Merging it into the target display would make one view setting silently change what a page requires, which hurts agent assembly.",
  category: "visualization",
  accepts: ["practiceNotes"],
  outputs: [],
  requires: ["practiceNotes"],
  configSpec: noteRollFields,
  defaultSize: { w: 4, h: 3 },
  minSize: { w: 2, h: 2 },
  docsPath: "docs/components/note-roll.md",
  status: "experimental",
};
