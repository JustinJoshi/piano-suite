/**
 * Workshop block-catalogue API authorization decision.
 *
 * `GET /api/blocks` returns the block registry: static, deploy-time metadata
 * describing what Workshop components exist and how they wire together
 * (kind, accepted/produced stream shapes, requirements, config fields). It
 * is a read-only description of a free product's capabilities, carries no
 * user data, and is identical for every caller. The policy is therefore
 * deliberately public — signed-in and anonymous callers get the same
 * response. The route still calls `auth()` and routes the result through
 * this decision function so that policy is explicit and enforced rather
 * than inherited by accident (AGENTS.md requires every `app/api` route
 * handler to authorize itself).
 */
export type BlocksApiAuthDecision = "ok";

export function authorizeBlocksApiAccess(options: {
  userId: string | null | undefined;
}): BlocksApiAuthDecision {
  // Accepted for shape parity with authorizeChatAccess and to make the
  // "identical for every caller" policy provable by test, not just assumed.
  void options.userId;
  return "ok";
}
