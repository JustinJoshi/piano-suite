import type { ComponentManifest } from "../manifest-types";
import { transportFields } from "./config";

export const transportManifest: ComponentManifest = {
  type: "transport",
  kind: "interactive",
  label: "Transport",
  summary: "Page clock: tempo, meter, count-in, play/pause, loop, and tempo ramp controls.",
  justification:
    "The Transport is the foundation of time-based page behavior. Every page with timed practice needs a single Transport to provide the master clock. The presence of a Transport determines whether a page is clock-advanced.",
  category: "rhythm",
  // The transport emits no notes; its clock is the loop other blocks'
  // `requires: ["transport"]` matches against.
  accepts: [],
  outputs: ["audioLoop"],
  requires: [],
  configSpec: transportFields,
  defaultSize: { w: 4, h: 2 },
  minSize: { w: 2, h: 1 },
  maxPerPage: 1,
  docsPath: "docs/components/transport.md",
  // The runtime reads the transport's config, but the block neither reads
  // nor writes the runtime yet — clock-advanced pages are the first step.
  status: "experimental",
};
