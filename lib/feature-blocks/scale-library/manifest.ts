import type { ComponentManifest } from "../manifest-types";
import { scaleLibraryFields } from "./config";

export const scaleLibraryManifest: ComponentManifest = {
  type: "scaleLibrary",
  kind: "source",
  label: "Scale library",
  summary:
    "Generates scale runs — 13 scales, any root, spans, directions, finger patterns, and custom Hanon-style cells.",
  justification:
    "Scale content is the backbone of technique practice. The existing scale runner hardcodes three patterns; this source generalizes them and adds the custom cell, which absorbs entire technique-book exercises as one cell plus a transposition rule.",
  category: "technique",
  accepts: [],
  outputs: ["practiceNotes"],
  requires: [],
  configSpec: scaleLibraryFields,
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 1 },
  docsPath: "docs/components/scale-library.md",
  status: "experimental",
};
