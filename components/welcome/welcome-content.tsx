"use client";

import { RollLandingSections } from "./roll/roll-landing";

/**
 * Pure marketing content for the welcome page: the roll, without its frame.
 *
 * Rendered by `WelcomePage` inside `RollFrame` (tracker bar, leader, paper,
 * key slip) and by the dev lab preview, which frames it itself. Copy and
 * style come from `useWelcomeConfig()`.
 */
export function WelcomeContent() {
  return <RollLandingSections />;
}
