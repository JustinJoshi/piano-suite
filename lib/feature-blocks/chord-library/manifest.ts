import type { ComponentManifest } from "../manifest-types";
import { chordLibraryFields } from "./config";

export const chordLibraryManifest: ComponentManifest = {
  type: "chordLibrary",
  kind: "source",
  label: "Chord library",
  summary:
    "Turns chord symbols or roman numerals into a chord stream, with closed or rootless voicings.",
  justification:
    "Chord content is reusable across drills — progressions, voicing practice, rhythm drills. Rootless voicings produce different MIDI note sets from identical pitch classes, a dimension the target-block model cannot represent.",
  category: "theory",
  accepts: [],
  outputs: ["practiceNotes"],
  requires: [],
  configSpec: chordLibraryFields,
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 1 },
  docsPath: "docs/components/chord-library.md",
  status: "experimental",
};
