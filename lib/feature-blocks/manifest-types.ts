// Convex-safe manifest definitions. No React, no lucide, relative imports only.
// This module is bundled by the Convex toolchain.

export type ComponentKind = "interactive" | "source" | "transform";

export type StreamShape = "practiceNotes" | "audioLoop" | "none";

export type RequirementId = "transport" | "practiceNotes" | "midiInput";

export type ConfigFieldSpec =
  | {
      kind: "range";
      key: string;
      label: string;
      min: number;
      max: number;
      step?: number;
      helperText?: string;
    }
  | {
      kind: "select";
      key: string;
      label: string;
      options: { label: string; value: string | number }[];
      helperText?: string;
    }
  | {
      kind: "toggle";
      key: string;
      label: string;
      helperText?: string;
    }
  | {
      kind: "checkbox-group";
      key: string;
      label: string;
      options: { label: string; value: string }[];
      helperText?: string;
    }
  | {
      kind: "text";
      key: string;
      label: string;
      placeholder?: string;
    };

export type FeatureCategory =
  | "rhythm"
  | "technique"
  | "theory"
  | "progress"
  | "visualization";

/**
 * Machine-readable specification for a component. Used by assembling agents
 * and by the component library UI to describe what each component does and
 * what it requires. Every interactive, source, and transform component must
 * have a manifest entry.
 */
export type ComponentManifest = {
  type: string;
  kind: ComponentKind;
  label: string;
  summary: string;
  justification: string;
  category: FeatureCategory;
  accepts: StreamShape[];
  outputs: StreamShape[];
  requires: RequirementId[];
  configSpec: ConfigFieldSpec[];
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxPerPage?: number;
  docsPath: string;
  status: "stable" | "experimental";
};

export type WiringIssue = {
  blockId: string;
  type: string;
  issue: "unmet_requirement" | "unconsumed_output" | "orphan_transform";
  detail: string;
};

export type ResolvedChain = {
  sources: { id: string; type: string }[];
  transforms: { id: string; type: string }[];
  displays: { id: string; type: string }[];
  issues: WiringIssue[];
};
