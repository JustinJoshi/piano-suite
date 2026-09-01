/**
 * The anonymous-access route matrix, shared by `proxy.ts` and unit tests.
 *
 * Public means "valuable without an account": marketing pages, guided
 * routes, articles, legal, community gallery + public drill views, and the
 * Workshop itself — Free persistence is localStorage
 * (`lib/custom-practice-storage.ts`), so a sign-in wall in front of the
 * editor protects nothing. Sign-in buys sync and publishing, never access.
 *
 * Every other `/tools/*` page stays behind Clerk: those tools log practice
 * events to Convex and assume a user row.
 */

/** Exact match or descendant — `startsWith("/dev")` alone would also open
 * `/devtools`, `startsWith("/sign-in")` would open `/sign-in-anything`. */
export const isExactOrUnder = (pathname: string, base: string): boolean =>
  pathname === base || pathname.startsWith(base + "/");

const PUBLIC_BASES = [
  "/articles",
  "/dev",
  "/sign-in",
  "/sign-up",
  "/api",
  "/__clerk",
  "/workshop",
] as const;

const PUBLIC_EXACT = [
  "/",
  "/pricing",
  "/start",
  "/tools/chladni",
  "/terms",
  "/privacy",
] as const;

// Guided routes are help content; activation starts before sign-up.
const PUBLIC_UNDER = ["/routes", "/tools/workshop", "/learn"] as const;

/** True when `pathname` is reachable without a Clerk session. */
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname as (typeof PUBLIC_EXACT)[number])) {
    return true;
  }

  return [...PUBLIC_UNDER, ...PUBLIC_BASES].some((base) =>
    isExactOrUnder(pathname, base)
  );
}
