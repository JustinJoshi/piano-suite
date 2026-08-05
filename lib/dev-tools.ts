/**
 * Dev-tools environment helpers.
 *
 * The dev lab and related tools are intentionally always enabled. They are
 * useful for tuning welcome/onboarding styling from any deployment, so we do
 * not gate them by environment or user.
 */

/** Server-side check: is this request running in a dev-tools-enabled environment? */
export function isDevToolsEnabled(): boolean {
  return true;
}

/** Client-side check: should the dev-tools link be visible? */
export function isDevToolsVisible(): boolean {
  return true;
}

/**
 * Server-side check: is this Clerk user allowed to use dev tools?
 *
 * Kept for API compatibility, but dev tools are currently open to everyone.
 */
export function isDevToolsUserAllowed(): boolean {
  return true;
}
