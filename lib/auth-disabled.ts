/**
 * Local/dev switch to bypass Clerk route and page gates.
 *
 * Set `NEXT_PUBLIC_AUTH_DISABLED=true` in `.env.local` and restart Next.js.
 * Convex persistence still requires a real Clerk session — unsigned use is
 * local-only (defaults, no saved history).
 *
 * Never enable this in production.
 */
export function isAuthDisabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
}
