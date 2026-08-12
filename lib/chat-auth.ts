/**
 * Chat API authorization decisions (owner allowlist).
 *
 * Chat always requires a verified Clerk session plus the allowlist — the
 * `NEXT_PUBLIC_AUTH_DISABLED` route-gate bypass never opens the paid LLM
 * endpoint. Unsigned callers are unauthorized and non-allowlisted users
 * are forbidden.
 */
export type ChatAuthDecision = "ok" | "unauthorized" | "forbidden";

export function authorizeChatAccess(options: {
  userId: string | null | undefined;
  allowedUserId: string | undefined;
}): ChatAuthDecision {
  if (!options.userId) {
    return "unauthorized";
  }

  if (!options.allowedUserId || options.userId !== options.allowedUserId) {
    return "forbidden";
  }

  return "ok";
}
