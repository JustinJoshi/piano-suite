import { clerkMiddleware } from "@clerk/nextjs/server";
import { isAuthBypassEffective } from "@/lib/auth-disabled";
import { getAuthorizedPartiesFromEnv } from "@/lib/clerk-authorized-parties";

/**
 * Clerk proxy middleware for Next.js 16+.
 *
 * Public routes: home, Pricing, Articles, Pattern Lab (homepage hero
 * editor), the Workshop (plus its block library), /start, dev lab,
 * sign-in/up, API, and Clerk's frontend API. Other /tools/* routes
 * require authentication, unless
 * `NEXT_PUBLIC_AUTH_DISABLED=true`. The bypass is never honored on Vercel
 * Production (see `isAuthBypassEffective`), so a stray env assignment there
 * cannot open the site.
 *
 * Every `app/api/**` route handler must authorize itself via `auth()` —
 * `/api` is public here by design (handlers are the enforcement point,
 * e.g. `/api/chat` checks the session + allowlist).
 *
 * Pricing is public so visitors can evaluate Free vs Pro before signing up.
 * Pattern Lab is public so visitors can customize the welcome hero without
 * signing in (prefs still sync to Convex when authenticated).
 * The dev lab is public so styling can be iterated from any deployment
 * without requiring authentication.
 *
 * Always pass `unauthenticatedUrl` so document requests redirect to
 * `/sign-in` instead of collapsing into a bare Next.js 404 (Clerk-dev + // pragma: allowlist secret
 * missing `dev-browser` handshake on `*.vercel.app` can otherwise do that).
 *
 * When `CLERK_AUTHORIZED_PARTIES` is set (comma-separated origins), it is
 * passed as `authorizedParties` so session tokens are only accepted from
 * those origins — recommended for production custom domains.
 *
 * @see https://clerk.com/docs/reference/nextjs/clerk-middleware
 * @see docs/phase-a-auth-cutover-plan.md
 */
const authorizedParties = getAuthorizedPartiesFromEnv();

/** Exact match or descendant — `startsWith("/dev")` alone would also open
 * `/devtools`, `startsWith("/sign-in")` would open `/sign-in-anything`. */
const isExactOrUnder = (pathname: string, base: string): boolean =>
  pathname === base || pathname.startsWith(base + "/");

export default clerkMiddleware(
  async (auth, request) => {
    if (isAuthBypassEffective()) {
      return;
    }

    const pathname = request.nextUrl.pathname;

    // Ready-made drills are public (audit 2026-09, Phase 0.2): "Play now"
    // must work for a first-time visitor. Signed-out practice writes to
    // local history (lib/local-practice-history.ts).
    const publicDrillRoutes = [
      "/tools/chord-drill",
      "/tools/arpeggios",
      "/tools/root-cycling",
      "/tools/progression",
    ];

    const isPublicRoute =
      pathname === "/" ||
      pathname === "/pricing" ||
      pathname === "/tools/chladni" ||
      publicDrillRoutes.includes(pathname) ||
      // The Workshop is the product's core (audit 2026-09, entry-flow §2):
      // free, no-account use is the default. Pages persist to localStorage
      // when signed out (lib/custom-practice-storage.ts). The block library
      // (/tools/workshop/blocks) is a descendant and opens with it.
      isExactOrUnder(pathname, "/tools/workshop") ||
      // /start is the three-door chooser the landing CTA points at; it
      // must open for visitors who have not signed up yet.
      pathname === "/start" ||
      // Guided routes are help content; activation starts before sign-up.
      isExactOrUnder(pathname, "/routes") ||
      // Legal pages must be readable by anonymous visitors.
      pathname === "/terms" ||
      pathname === "/privacy" ||
      // Marketplace gallery + public drill pages are public for community
      // sharing. /workshop is the legacy gallery path — public so old
      // shared links redirect to /marketplace for anonymous visitors too.
      ["/articles", "/dev", "/sign-in", "/sign-up", "/api", "/__clerk", "/marketplace", "/workshop"].some(
        (base) => isExactOrUnder(pathname, base)
      );

    if (!isPublicRoute) {
      const signInUrl = new URL("/sign-in", request.url).href; // pragma: allowlist secret
      await auth.protect({ unauthenticatedUrl: signInUrl });
    }
  },
  authorizedParties ? { authorizedParties } : {}
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk-specific frontend API routes
    "/__clerk/(.*)",
  ],
};
