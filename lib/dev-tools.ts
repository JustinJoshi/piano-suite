/**
 * Dev-tools environment helpers.
 *
 * The dev lab stays reachable at /dev/* from any deployment so styling can
 * be iterated without auth, but its floating entry link only renders
 * outside production (audit 2026-09, Phase 0.4): a "Dev lab" button on the
 * public landing page is product surface, not a tool.
 */

/** Server-side check: is this request running in a dev-tools-enabled environment? */
export function isDevToolsEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** Client-side check: should the dev-tools link be visible? */
export function isDevToolsVisible(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Server-side check: is this Clerk user allowed to use dev tools?
 *
 * Kept for API compatibility, but dev tools are currently open to everyone.
 */
export function isDevToolsUserAllowed(): boolean {
  return true;
}
