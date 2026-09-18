import type { ComponentManifest } from "../manifest-types";
import { songPlayerFields } from "./config";

export const songPlayerManifest: ComponentManifest = {
  type: "songPlayer",
  kind: "interactive",
  label: "Song player",
  summary:
    "Upload a MIDI or audio file and play it back through the piano sound while you follow along.",
  justification:
    "The music player already exists as a standalone widget; demoting it into a block lets any practice page carry its own playback without forking the component.",
  category: "technique",
  accepts: [],
  outputs: [],
  requires: [],
  configSpec: songPlayerFields,
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 2, h: 2 },
  docsPath: "docs/components/song-player.md",
  status: "experimental",
};
