/**
 * Switch to bypass Clerk route and page gates.
 *
 * Set `NEXT_PUBLIC_AUTH_DISABLED=true` (and restart Next.js / redeploy Vercel
 * so the `NEXT_PUBLIC_*` value is baked in). Convex persistence still requires
 * a real Clerk session — unsigned use is local-only (defaults, no saved
 * history).
 *
 * Prefer leaving this off. The personal Hobby deploy may set it on Vercel as a
 * temporary workaround for Clerk-dev + `*.vercel.app` bare 404s (see README
 * Deploy notes); remove it once a custom domain + Clerk production keys are
 * in place.
 */
export function isAuthDisabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
}
