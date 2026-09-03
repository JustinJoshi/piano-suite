import type { ComponentManifest } from "../manifest-types";
import { pieceLibraryFields } from "./config";

export const pieceLibraryManifest: ComponentManifest = {
  type: "pieceLibrary",
  kind: "source",
  label: "Piece library",
  summary:
    "Turns an uploaded MIDI file into timed notes with a hand filter, role, and transpose.",
  justification:
    "Practicing real repertoire needs exact pitches and timing from the piece itself. This source adapts the music player's existing MIDI parser into the page stream — an adapter over a shipped primitive, not a new parser.",
  category: "technique",
  accepts: [],
  outputs: ["practiceNotes"],
  requires: [],
  configSpec: pieceLibraryFields,
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 1 },
  docsPath: "docs/components/piece-library.md",
  status: "experimental",
};
