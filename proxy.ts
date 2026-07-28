import { clerkMiddleware } from "@clerk/nextjs/server";
import { isAuthDisabled } from "@/lib/auth-disabled";

/**
 * Clerk proxy middleware for Next.js 16+.
 *
 * Public routes: home, sign-in, sign-up, API routes, and Clerk's frontend API.
 * All other routes (including /tools and /tools/*) require authentication,
 * unless auth bypass is enabled (default; set `NEXT_PUBLIC_AUTH_DISABLED=false`
 * to require sign-in).
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
