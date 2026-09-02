import type { FeatureBlock } from "./types";
import type {
  ComponentManifest,
  ComponentKind,
  RequirementId,
  WiringIssue,
  ResolvedChain,
} from "./manifest-types";

// Component manifests are loaded at build time from the per-component manifest.ts files.
// For now, we have the existing 12 blocks from PR #77, all of which are interactive.

const EXISTING_BLOCK_MANIFESTS: Record<string, ComponentManifest> = {
  metronome: {
    type: "metronome",
    kind: "interactive",
    label: "Metronome",
    summary: "Steady beat accompaniment.",
    justification:
      "Page chrome: every drill benefits from a click track and subdivisions.",
    category: "rhythm",
    accepts: [],
    outputs: [],
    requires: [],
    configSpec: [
      {
        kind: "range",
        key: "bpm",
        label: "Tempo",
        min: 30,
        max: 300,
        step: 1,
      },
      {
        kind: "select",
        key: "beatsPerBar",
        label: "Beats per bar",
        options: [
          { label: "2", value: 2 },
          { label: "3", value: 3 },
          { label: "4", value: 4 },
          { label: "5", value: 5 },
          { label: "6", value: 6 },
          { label: "7", value: 7 },
          { label: "8", value: 8 },
          { label: "9", value: 9 },
          { label: "12", value: 12 },
        ],
      },
      {
        kind: "toggle",
        key: "accentFirstBeat",
        label: "Accent first beat",
      },
    ],
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    docsPath: "docs/components/metronome.md",
    status: "stable",
  },
  drillTimer: {
    type: "drillTimer",
    kind: "interactive",
    label: "Drill timer",
    summary: "Countdown, live timing, and rest between rounds.",
    justification:
      "Page chrome: measures time on page and tracks reps; required for timed drills.",
    category: "technique",
    accepts: [],
    outputs: [],
    requires: [],
    configSpec: [
      {
        kind: "range",
        key: "countdownSeconds",
        label: "Countdown",
        min: 0,
        max: 30,
        step: 1,
      },
      {
        kind: "range",
        key: "breakSeconds",
        label: "Break",
        min: 0,
        max: 60,
        step: 1,
      },
      {
        kind: "toggle",
        key: "multiRep",
        label: "Multi-rep mode",
      },
      {
        kind: "toggle",
        key: "showLiveTimer",
        label: "Show live timer",
      },
    ],
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    docsPath: "docs/components/drill-timer.md",
    status: "stable",
  },
  chordSet: {
    type: "chordSet",
    kind: "interactive",
    label: "Chord set",
    summary: "Display and drill a set of chords.",
    justification:
      "Historical: first target block. Replaced by Target display and Chord library.",
    category: "theory",
    accepts: [],
    outputs: ["practiceNotes"],
    requires: [],
    configSpec: [
      {
        kind: "checkbox-group",
        key: "roots",
        label: "Roots",
        options: [
          { label: "C", value: "C" },
          { label: "F", value: "F" },
          { label: "G", value: "G" },
        ],
      },
      {
        kind: "checkbox-group",
        key: "qualityGroups",
        label: "Chord qualities",
        options: [
          { label: "Triads", value: "Triads" },
          { label: "7ths", value: "7ths" },
        ],
      },
      {
        kind: "select",
        key: "order",
        label: "Order",
        options: [
          { label: "Sequential", value: "sequential" },
          { label: "Random", value: "random" },
        ],
      },
      {
        kind: "toggle",
        key: "requireExact",
        label: "Require exact notes",
      },
      {
        kind: "range",
        key: "goodThreshold",
        label: "Good threshold",
        min: 0,
        max: 20,
        step: 1,
      },
      {
        kind: "range",
        key: "hardThreshold",
        label: "Hard threshold",
        min: 0,
        max: 20,
        step: 1,
      },
    ],
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxPerPage: 1,
    docsPath: "docs/components/chord-set.md",
    status: "stable",
  },
  textBlock: {
    type: "textBlock",
    kind: "interactive",
    label: "Instructions",
    summary: "Add text notes to your page.",
    justification: "Page chrome: users add their own instructions and tips.",
    category: "technique",
    accepts: [],
    outputs: [],
    requires: [],
    configSpec: [
      {
        kind: "text",
        key: "text",
        label: "Content",
        placeholder: "Write your instructions here...",
      },
    ],
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    docsPath: "docs/components/text-block.md",
    status: "stable",
  },
  midiConnectionBar: {
    type: "midiConnectionBar",
    kind: "interactive",
    label: "MIDI connection",
    summary: "Show MIDI keyboard status.",
    justification:
      "Page chrome: users need to know whether their controller is connected; bar also embeds the on-screen keyboard when hardware is absent.",
    category: "rhythm",
    accepts: [],
    outputs: [],
    requires: ["midiInput"],
    configSpec: [
      {
        kind: "toggle",
        key: "compact",
        label: "Compact mode",
      },
    ],
    defaultSize: { w: 4, h: 1 },
    minSize: { w: 1, h: 1 },
    docsPath: "docs/components/midi-connection-bar.md",
    status: "stable",
  },
  drillShortcuts: {
    type: "drillShortcuts",
    kind: "interactive",
    label: "Ready-made drills",
    summary: "Quick links to the four guided drill routes.",
    justification: "Navigation: lets users jump from a workshop page to a ready-made drill.",
    category: "technique",
    accepts: [],
    outputs: [],
    requires: [],
    configSpec: [],
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxPerPage: 1,
    docsPath: "docs/components/drill-shortcuts.md",
    status: "stable",
  },
  keyboardDisplay: {
    type: "keyboardDisplay",
    kind: "interactive",
    label: "On-screen keyboard",
    summary: "Click or tap to play notes without hardware.",
    justification:
      "Page chrome: fallback input device; lets users practice without a MIDI keyboard.",
    category: "technique",
    accepts: [],
    outputs: [],
    requires: [],
    configSpec: [
      {
        kind: "select",
        key: "lowNote",
        label: "Lowest key",
        options: [
          { label: "C1", value: 12 },
          { label: "C2", value: 24 },
          { label: "C3", value: 36 },
          { label: "C4", value: 48 },
          { label: "C5", value: 60 },
          { label: "C6", value: 72 },
        ],
      },
      {
        kind: "range",
        key: "octaves",
        label: "Octaves",
        min: 1,
        max: 4,
        step: 1,
      },
      {
        kind: "toggle",
        key: "showNoteNames",
        label: "Show note names",
      },
      {
        kind: "toggle",
        key: "computerKeys",
        label: "Computer keys",
      },
    ],
    defaultSize: { w: 4, h: 2 },
    minSize: { w: 1, h: 1 },
    docsPath: "docs/components/keyboard-display.md",
    status: "stable",
  },
  scaleRunner: {
    type: "scaleRunner",
    kind: "interactive",
    label: "Scale run",
    summary: "Practice scales with configurable span and direction.",
    justification: "Historical: second target block. Replaced by Target display and Scale library.",
    category: "technique",
    accepts: [],
    outputs: ["practiceNotes"],
    requires: [],
    configSpec: [
      {
        kind: "select",
        key: "scale",
        label: "Scale",
        options: [
          { label: "Major", value: "major" },
          { label: "Natural minor", value: "naturalMinor" },
        ],
      },
    ],
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxPerPage: 1,
    docsPath: "docs/components/scale-runner.md",
    status: "stable",
  },
  rootCycle: {
    type: "rootCycle",
    kind: "interactive",
    label: "Key cycle",
    summary: "Drill one chord shape through all 12 keys.",
    justification:
      "Historical: third target block. Replaced by Target display and Chord library + Key cycle transform.",
    category: "theory",
    accepts: [],
    outputs: ["practiceNotes"],
    requires: [],
    configSpec: [
      {
        kind: "select",
        key: "shape",
        label: "Shape",
        options: [
          { label: "Major triad", value: "major" },
          { label: "Minor triad", value: "minor" },
        ],
      },
    ],
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxPerPage: 1,
    docsPath: "docs/components/root-cycle.md",
    status: "stable",
  },
  progression: {
    type: "progression",
    kind: "interactive",
    label: "Progression",
    summary: "Practice roman numeral progressions in one or all keys.",
    justification:
      "Historical: fourth target block. Replaced by Target display and Chord library + Key cycle transform.",
    category: "theory",
    accepts: [],
    outputs: ["practiceNotes"],
    requires: [],
    configSpec: [
      {
        kind: "text",
        key: "numerals",
        label: "Progression",
        placeholder: "ii V I",
      },
    ],
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxPerPage: 1,
    docsPath: "docs/components/progression.md",
    status: "stable",
  },
  sessionStats: {
    type: "sessionStats",
    kind: "interactive",
    label: "Session stats",
    summary: "Reps, speed, and grades for this page.",
    justification:
      "Page chrome: users track their progress session-to-session. Later expanded to Practice report.",
    category: "progress",
    accepts: [],
    outputs: [],
    requires: [],
    configSpec: [],
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    maxPerPage: 1,
    docsPath: "docs/components/session-stats.md",
    status: "stable",
  },
  restTimer: {
    type: "restTimer",
    kind: "interactive",
    label: "Rest timer",
    summary: "Count down a rest between practice sets.",
    justification: "Page chrome: time-boxes rest between rounds so users stay on schedule.",
    category: "rhythm",
    accepts: [],
    outputs: [],
    requires: [],
    configSpec: [
      {
        kind: "range",
        key: "seconds",
        label: "Length",
        min: 5,
        max: 600,
        step: 5,
      },
      {
        kind: "text",
        key: "label",
        label: "Label",
        placeholder: "Rest",
      },
      {
        kind: "toggle",
        key: "chime",
        label: "Chime when the rest ends",
      },
    ],
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    docsPath: "docs/components/rest-timer.md",
    status: "stable",
  },
};

/**
 * Look up the manifest for a single component by type.
 */
export function getManifest(type: string): ComponentManifest | null {
  return EXISTING_BLOCK_MANIFESTS[type] ?? null;
}

/**
 * List all manifests, optionally filtered by kind.
 */
export function listManifests(kind?: ComponentKind): ComponentManifest[] {
  const all = Object.values(EXISTING_BLOCK_MANIFESTS);
  if (!kind) return all;
  return all.filter((m) => m.kind === kind);
}

/**
 * Group all manifests by kind. Used by the library UI to render
 * interactive components prominently and sources/transforms quietly.
 */
export function manifestsByKind(): Record<ComponentKind, ComponentManifest[]> {
  const result: Record<ComponentKind, ComponentManifest[]> = {
    interactive: [],
    source: [],
    transform: [],
  };
  for (const manifest of Object.values(EXISTING_BLOCK_MANIFESTS)) {
    result[manifest.kind].push(manifest);
  }
  return result;
}

/**
 * Validate the wiring of a page. Returns an array of issues if any components
 * have unmet requirements or are orphaned (transforms with no source).
 */
export function validatePageWiring(blocks: FeatureBlock[]): WiringIssue[] {
  const issues: WiringIssue[] = [];
  const typesByBlock = new Map(blocks.map((b) => [b.id, b.type]));
  const manifests = new Map(
    Object.values(EXISTING_BLOCK_MANIFESTS).map((m) => [m.type, m])
  );

  for (const block of blocks) {
    const manifest = manifests.get(block.type);
    if (!manifest) {
      issues.push({
        blockId: block.id,
        type: block.type,
        issue: "unmet_requirement",
        detail: `Unknown component type: ${block.type}`,
      });
      continue;
    }

    // Check requirements
    for (const req of manifest.requires) {
      const isMet = blocks.some((b) => {
        const m = manifests.get(b.type);
        return m && m.outputs.includes(requirementToStream(req));
      });
      if (!isMet) {
        issues.push({
          blockId: block.id,
          type: block.type,
          issue: "unmet_requirement",
          detail: `Requires: ${req}`,
        });
      }
    }

    // Check orphaned transforms (transforms with no source)
    if (manifest.kind === "transform") {
      const hasSource = blocks.some((b) => {
        const m = manifests.get(b.type);
        return (
          m &&
          (m.kind === "source" || m.kind === "interactive") &&
          manifest.accepts.some((shape) => m.outputs.includes(shape))
        );
      });
      if (!hasSource) {
        issues.push({
          blockId: block.id,
          type: block.type,
          issue: "orphan_transform",
          detail: `No upstream source provides: ${manifest.accepts.join(", ")}`,
        });
      }
    }
  }

  return issues;
}

/**
 * Serialize the registry to a compact JSON description for assembling agents.
 */
export function describeRegistryForAgent(): string {
  const manifests = Object.values(EXISTING_BLOCK_MANIFESTS).map((m) => ({
    type: m.type,
    kind: m.kind,
    label: m.label,
    summary: m.summary,
    justification: m.justification,
    accepts: m.accepts,
    outputs: m.outputs,
    requires: m.requires,
    status: m.status,
  }));

  return JSON.stringify(
    {
      title: "Piano Suite Workshop Component Registry",
      description:
        "Interactive, source, and transform components for building practice pages.",
      components: manifests,
      guidance: {
        assembly: "An assembling agent receives this description and builds pages by selecting and wiring components.",
        kinds: {
          interactive:
            "User-facing component with its own tile in the library. Has a UI.",
          source:
            "Produces content (e.g., a chord library, a scale library). No upstream requirement. Rendered as a row in a Sources section.",
          transform:
            "Modifies content from a source (e.g., key cycle, rhythm pattern). Must have an upstream source. Rendered as a row in a Transforms section.",
        },
      },
    },
    null,
    2
  );
}

/**
 * Resolve the data flow through a page: order sources, then transforms,
 * then displays. Later used by the runtime to compose the practice stream.
 */
export function resolveChain(blocks: FeatureBlock[]): ResolvedChain {
  const manifests = new Map(
    Object.values(EXISTING_BLOCK_MANIFESTS).map((m) => [m.type, m])
  );

  const sources: { id: string; type: string }[] = [];
  const transforms: { id: string; type: string }[] = [];
  const displays: { id: string; type: string }[] = [];
  const issues = validatePageWiring(blocks);

  for (const block of blocks) {
    const manifest = manifests.get(block.type);
    if (!manifest) continue;

    if (manifest.kind === "source") {
      sources.push({ id: block.id, type: block.type });
    } else if (manifest.kind === "transform") {
      transforms.push({ id: block.id, type: block.type });
    } else {
      displays.push({ id: block.id, type: block.type });
    }
  }

  return { sources, transforms, displays, issues };
}

/**
 * Convert a RequirementId to its corresponding StreamShape.
 */
function requirementToStream(req: RequirementId): string {
  switch (req) {
    case "practiceNotes":
      return "practiceNotes";
    case "audioLoop":
      return "audioLoop";
    default:
      return "none";
  }
}
