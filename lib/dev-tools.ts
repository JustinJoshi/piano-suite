/**
 * Dev-tools environment helpers.
 *
 * The dev lab and related tools are available:
 * - locally (`npm run dev`), and
 * - on Vercel preview deployments (`VERCEL_ENV === "preview"`).
 *
 * They are never available on a production deployment.
 */

/** Server-side check: is this request running in a dev-tools-enabled environment? */
export function isDevToolsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview"
  );
}

/** Client-side check: should the dev-tools link be visible? */
export function isDevToolsVisible(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
  );
}

function getAllowedUserIds(): Set<string> {
  const raw = process.env.DEV_TOOLS_ALLOWED_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

/**
 * Server-side check: is this Clerk user allowed to use dev tools?
 *
 * - In local development, everyone is allowed.
 * - On preview deployments, if `DEV_TOOLS_ALLOWED_USER_IDS` is set, only those
 *   user IDs are allowed. If it is not set, any authenticated user is allowed
 *   (the middleware already requires authentication for `/dev/*`).
 */
export function isDevToolsUserAllowed(userId: string | null): boolean {
  if (process.env.NODE_ENV === "development") return true;

  const allowed = getAllowedUserIds();
  if (allowed.size === 0) {
    // No explicit allowlist on preview: allow any authenticated user.
    return userId !== null;
  }

  return userId !== null && allowed.has(userId);
}
