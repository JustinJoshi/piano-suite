/**
 * Opt-in switch to bypass Clerk route and page gates.
 *
 * Returns true **only** when `NEXT_PUBLIC_AUTH_DISABLED` is exactly `"true"`
 * (restart Next.js / redeploy Vercel so the `NEXT_PUBLIC_*` value is baked in).
 * Unset / `"false"` / `"1"` all leave auth enabled — do not reintroduce
 * default-on bypass.
 *
 * Convex persistence still requires a real Clerk session — unsigned use is
 * local-only. Prefer leaving this off. Hobby Vercel may set it temporarily for
 * Clerk-dev + `*.vercel.app` bare 404s (see README Deploy); remove it once a
 * custom domain + Clerk production keys (`pk_live`) are in place.
 */
export function isAuthDisabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";
}
