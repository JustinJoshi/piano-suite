/**
 * Switch to bypass Clerk route and page gates.
 *
 * Auth bypass is **on by default**. Set `NEXT_PUBLIC_AUTH_DISABLED=false` in
 * `.env.local` (and restart Next.js) to require sign-in again.
 *
 * Convex persistence still requires a real Clerk session — unsigned use is
 * local-only (defaults, no saved history).
 */
export function isAuthDisabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_DISABLED !== "false";
}
