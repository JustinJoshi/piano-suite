import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
// Relative import: this module is bundled by the Convex toolchain, which
// does not resolve the `@/` alias.
import type { BlockSize } from "../workshop-grid";

/**
 * A field descriptor drives the settings form for a feature block.
 * It is intentionally separate from the validation/normalization logic:
 * the descriptor says *how* to render the editor, the normalizer says
 * *what* the data means.
 */
export type FieldDescriptor =
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
 * A feature definition is the contract that turns a React component into a
 * reusable, user-configurable block. The registry is the single source of truth
 * for both the runtime renderer and the editor palette.
 */
export type FeatureDefinition<C extends Record<string, unknown>> = {
  type: string;
  category: FeatureCategory;
  label: string;
  description: string;
  icon: LucideIcon;
  fields: FieldDescriptor[];
  defaultConfig: C;
  normalizeConfig: (raw: unknown) => C;
  component: ComponentType<C>;
  /**
   * What this block contributes to the page runtime. `"targets"` blocks feed
   * the drill runtime, and only the first one on a page is live — see
   * `lib/feature-blocks/target-blocks.ts`.
   */
  provides?: "targets";
  /**
   * How many copies of this block make sense on one page. The editor refuses
   * to add past the limit; `undefined` means unlimited.
   */
  maxPerPage?: number;
};

/**
 * Stored instance of a feature inside a custom practice page.
 * `size` is the Workshop grid tile span in canonical column/row units;
 * absent for legacy blocks (renderers fall back to per-type defaults).
 */
export type FeatureBlock = {
  id: string;
  type: string;
  version: number;
  config: Record<string, unknown>;
  size?: BlockSize;
};

/**
 * A user-created practice page. Stored as JSON in localStorage (Free) or Convex
 * (Pro / AUTH_DISABLED).
 */
export type PracticePage = {
  id: string;
  title: string;
  blocks: FeatureBlock[];
  updatedAt: number;
};
