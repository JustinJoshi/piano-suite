/**
 * Chat API authorization decisions (owner allowlist).
 *
 * When auth bypass is on, the chat route skips these checks — that must stay
 * opt-in only. With bypass off, unsigned callers are unauthorized and
 * non-allowlisted users are forbidden.
 */
export type ChatAuthDecision = "ok" | "unauthorized" | "forbidden";

export function authorizeChatAccess(options: {
  authDisabled: boolean;
  userId: string | null | undefined;
  allowedUserId: string | undefined;
}): ChatAuthDecision {
  if (options.authDisabled) {
    return "ok";
  }

  if (!options.userId) {
    return "unauthorized";
  }

  if (!options.allowedUserId || options.userId !== options.allowedUserId) {
    return "forbidden";
  }

  return "ok";
}
