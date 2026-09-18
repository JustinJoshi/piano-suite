import type { ComponentManifest } from "../manifest-types";
import { sectionLoopFields } from "./config";

export const sectionLoopManifest: ComponentManifest = {
  type: "sectionLoop",
  kind: "transform",
  label: "Section loop",
  summary:
    "Practise bars N–M of the incoming stream, repeated — one section at a time instead of the whole piece.",
  justification:
    "Length is a property of the stream, not the source. Looping a window of bars over any source (a scale, a chord page, an uploaded piece) is one generic transform instead of per-source section controls, and it composes before displays so the note roll, targets, and clock all agree on the loop.",
  category: "rhythm",
  accepts: ["practiceNotes"],
  outputs: ["practiceNotes"],
  requires: [],
  configSpec: sectionLoopFields,
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 1 },
  docsPath: "docs/components/section-loop.md",
  status: "experimental",
};
