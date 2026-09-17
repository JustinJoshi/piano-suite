import { auth } from "@clerk/nextjs/server";
import { describeRegistryForAgent } from "@/lib/feature-blocks/manifest";
import { authorizeBlocksApiAccess } from "@/lib/blocks-api-auth";

/**
 * GET /api/blocks — the Workshop block catalogue.
 *
 * Returns `describeRegistryForAgent()`: every registered feature block
 * (kind, accepted/produced stream shapes, requirements, config fields) so
 * an external assembling agent can describe practice pages built from
 * these blocks. This is static registry metadata, not user data, and does
 * not change between deploys, so the response is identical for every
 * caller.
 *
 * Policy: public. Anyone, signed in or not, may read this endpoint — it is
 * a read-only description of a free product's capabilities. `auth()` is
 * still called and routed through `authorizeBlocksApiAccess` so that policy
 * is explicit and enforced rather than inherited by accident (AGENTS.md:
 * every `app/api` route handler must authorize itself).
 */
export async function GET() {
  const decision = authorizeBlocksApiAccess({ userId: (await auth()).userId });

  if (decision !== "ok") {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(describeRegistryForAgent(), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Deploy-time-static catalogue: safe to cache at the edge/CDN and
      // revalidate in the background rather than refetch on every call.
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
