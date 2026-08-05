import { clerkMiddleware } from "@clerk/nextjs/server";
import { isAuthDisabled } from "@/lib/auth-disabled";
import { getAuthorizedPartiesFromEnv } from "@/lib/clerk-authorized-parties";

/**
 * Clerk proxy middleware for Next.js 16+.
 *
 * Public routes: home, Pricing, Pattern Lab (homepage hero editor), dev lab,
 * sign-in/up, API, and Clerk's frontend API. Other /tools/* routes require
 * authentication, unless `NEXT_PUBLIC_AUTH_DISABLED=true`.
 *
 * Pricing is public so visitors can evaluate Free vs Pro before signing up.
 * Pattern Lab is public so visitors can customize the welcome hero without
 * signing in (prefs still sync to Convex when authenticated).
 * The dev lab is public so styling can be iterated from any deployment
 * without requiring authentication.
 *
 * Always pass `unauthenticatedUrl` so document requests redirect to
 * `/sign-in` instead of collapsing into a bare Next.js 404 (Clerk-dev +
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
    if (isAuthDisabled()) {
      return;
    }

    const pathname = request.nextUrl.pathname;

    const isPublicRoute =
      pathname === "/" ||
      pathname === "/pricing" ||
      pathname === "/tools/chladni" ||
      pathname.startsWith("/dev") ||
      pathname.startsWith("/sign-in") ||
      pathname.startsWith("/sign-up") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/__clerk");

    if (!isPublicRoute) {
      const signInUrl = new URL("/sign-in", request.url).href;
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
