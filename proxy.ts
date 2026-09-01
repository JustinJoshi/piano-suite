import { clerkMiddleware } from "@clerk/nextjs/server";
import { isAuthBypassEffective } from "@/lib/auth-disabled";
import { getAuthorizedPartiesFromEnv } from "@/lib/clerk-authorized-parties";
import { isPublicPath } from "@/lib/public-routes";

/**
 * Clerk proxy middleware for Next.js 16+.
 *
 * The public-route matrix lives in `lib/public-routes.ts` (unit-tested
 * there). In short: home, Pricing, Articles, guided routes, legal, the
 * community gallery (`/workshop`), Pattern Lab, the dev lab, the Workshop
 * editor + marketplace, sign-in/up, API, and Clerk's frontend API are
 * anonymous-access. Other `/tools/*` routes require authentication, unless
 * `NEXT_PUBLIC_AUTH_DISABLED=true`. The bypass is never honored on Vercel
 * Production (see `isAuthBypassEffective`), so a stray env assignment there
 * cannot open the site.
 *
 * The Workshop is public because the Free tier persists pages to
 * localStorage (`lib/custom-practice-storage.ts`) — the gate protected
 * nothing. Sign-in buys sync and publishing, not access.
 *
 * Every `app/api/**` route handler must authorize itself via `auth()` —
 * `/api` is public here by design (handlers are the enforcement point,
 * e.g. `/api/chat` checks the session + allowlist).
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

export default clerkMiddleware(
  async (auth, request) => {
    if (isAuthBypassEffective()) {
      return;
    }

    if (!isPublicPath(request.nextUrl.pathname)) {
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
