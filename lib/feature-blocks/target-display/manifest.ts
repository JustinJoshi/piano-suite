import type { ComponentManifest } from "../manifest-types";

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
  configSpec: [
    {
      kind: "select",
      key: "view",
      label: "Display style",
      options: [
        { label: "Chord symbols", value: "symbols" },
        { label: "Keys diagram", value: "keysDiagram" },
      ],
      helperText: "How to show the current target",
    },
    {
      kind: "toggle",
      key: "showNext",
      label: "Show next",
      helperText: "Preview the upcoming target",
    },
    {
      kind: "toggle",
      key: "showPosition",
      label: "Show position",
      helperText: "Display progress (e.g. 3 of 8)",
    },
  ],
  defaultSize: { w: 2, h: 2 },
  minSize: { w: 1, h: 1 },
  docsPath: "docs/components/target-display.md",
  status: "stable",
};
