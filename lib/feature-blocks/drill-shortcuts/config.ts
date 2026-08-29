import type { FieldDescriptor } from "../types";

/**
 * Ready-made drills tile: shortcuts into the guided drills. The content is
 * derived from the `drillTools` registry, so there is nothing to configure.
 */
export type DrillShortcutsConfig = Record<string, never>;

export const drillShortcutsDefaultConfig: DrillShortcutsConfig = {};

export function normalizeDrillShortcutsConfig(
  raw: unknown
): DrillShortcutsConfig {
  // Nothing is configurable: whatever was stored collapses to {}.
  if (typeof raw !== "object" || raw === null) return {};
  return {};
}

export const drillShortcutsFields: FieldDescriptor[] = [];
