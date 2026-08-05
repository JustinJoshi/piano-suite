/**
 * Dev-tools environment helpers.
 *
 * The dev lab and related tools are available:
 * - locally (`npm run dev`), and
 * - on Vercel preview deployments (`VERCEL_ENV === "preview"`).
 *
 * They are never available on a production deployment.
 *
 * A localStorage override (`piano-suite:dev-tools:visible`) is also supported
 * on the client so preview links can be revealed even when env detection is
 * unavailable (e.g. custom preview domains or cached builds).
 */

const VISIBILITY_STORAGE_KEY = "piano-suite:dev-tools:visible";

function isPreviewHostname(hostname: string): boolean {
  return hostname.includes(".vercel.app") || hostname.includes("-git-");
}

/** Server-side check: is this request running in a dev-tools-enabled environment? */
export function isDevToolsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.VERCEL_ENV === "preview"
  );
}

/** Client-side check: should the dev-tools link be visible? */
export function isDevToolsVisible(): boolean {
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage.getItem(VISIBILITY_STORAGE_KEY) === "true") {
        return true;
      }
    } catch {
      // Ignore storage errors.
    }
  }

  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    (typeof window !== "undefined" &&
      isPreviewHostname(window.location.hostname)) ||
    process.env.NEXT_PUBLIC_VERCEL_URL !== undefined
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
