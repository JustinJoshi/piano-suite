import { clerkMiddleware } from "@clerk/nextjs/server";
import { isAuthDisabled } from "@/lib/auth-disabled";

/**
 * Clerk proxy middleware for Next.js 16+.
 *
 * Public routes: home, Pattern Lab (homepage hero editor), sign-in/up, API,
 * and Clerk's frontend API. Other /tools/* routes require authentication,
 * unless `NEXT_PUBLIC_AUTH_DISABLED=true`.
 *
 * Pattern Lab is public so visitors can customize the welcome hero without
 * signing in (prefs still sync to Convex when authenticated). Clerk's
 * `auth.protect()` otherwise rewrites unsigned tool hits to a bare 404
 * under development keys (`dev-browser-missing`).
 *
 * @see https://clerk.com/docs/reference/nextjs/clerk-middleware
 */
export default clerkMiddleware(async (auth, request) => {
  if (isAuthDisabled()) {
    return;
  }

  const pathname = request.nextUrl.pathname;

  const isPublicRoute =
    pathname === "/" ||
    pathname === "/tools/chladni" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/__clerk");

  if (!isPublicRoute) {
    await auth.protect();
  }
});

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
