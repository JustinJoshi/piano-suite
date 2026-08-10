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

/**
 * Server-side gates (`proxy.ts`, route handlers) must use this instead of
 * `isAuthDisabled()`. The bypass is never honored on Vercel Production
 * (`VERCEL_ENV === "production"`), so a stray env assignment there cannot
 * open the site at the next build. Local dev and Hobby previews
 * (`VERCEL_ENV === "preview"` or unset) keep working.
 *
 * Client code keeps using `isAuthDisabled()`: `VERCEL_ENV` is not inlined
 * into the client bundle (only `NEXT_PUBLIC_*` vars are), so guarding there
 * would diverge from the server. Worst case with the flag set on prod, the
 * UI offers a feature the server then rejects — the runbook fix is still
 * "unset the var".
 */
export function isAuthBypassEffective(): boolean {
  return isAuthDisabled() && process.env.VERCEL_ENV !== "production";
}
