import { clerkMiddleware } from "@clerk/nextjs/server";
import { isAuthBypassEffective } from "@/lib/auth-disabled";
import { getAuthorizedPartiesFromEnv } from "@/lib/clerk-authorized-parties";

/**
 * Clerk proxy middleware for Next.js 16+.
 *
 * Public routes: home, Pricing, Articles, Pattern Lab (homepage hero
 * editor), dev lab, sign-in/up, API, and Clerk's frontend API. Other
 * /tools/* routes require authentication, unless
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

    const isPublicRoute =
      pathname === "/" ||
      pathname === "/pricing" ||
      pathname === "/tools/chladni" ||
      // Articles are public: the library is marketing/SEO content for the
      // free learning community, and the landing hero links to it.
      ["/articles", "/dev", "/sign-in", "/sign-up", "/api", "/__clerk"].some(
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
