import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import {
  entitlementFromWebhookEvent,
  profileFromWebhookUser,
} from "@/lib/clerk-webhook";

export const runtime = "nodejs";

/**
 * Clerk webhook receiver. The svix signature (verified by `verifyWebhook`
 * against `CLERK_WEBHOOK_SIGNING_SECRET`) IS the authorization for this
 * route — `/api` is public in `proxy.ts` by design.
 *
 * Mirrors Clerk Billing entitlement into the Convex `users.syncEntitled`
 * column (see `convex/users.ts` `applyWebhookEntitlement`, gated by the
 * server-to-server `CLERK_WEBHOOK_SHARED_SECRET`) and keeps profile fields
 * fresh on `user.updated`.
 */
export async function POST(req: NextRequest) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  const sharedSecret = process.env.CLERK_WEBHOOK_SHARED_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!signingSecret || !sharedSecret || !convexUrl) {
    return new Response("Webhook not configured", { status: 500 });
  }

  let event;
  try {
    event = await verifyWebhook(req, { signingSecret });
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  const client = new ConvexHttpClient(convexUrl);

  const entitlement = entitlementFromWebhookEvent(event);
  if (entitlement) {
    await client.mutation(api.users.applyWebhookEntitlement, {
      clerkId: entitlement.clerkId,
      entitled: entitlement.entitled,
      secret: sharedSecret,
    });
    return new Response("ok", { status: 200 });
  }

  if (event.type === "user.updated") {
    const profile = profileFromWebhookUser(event.data);
    if (profile) {
      await client.mutation(api.users.applyWebhookProfile, {
        clerkId: profile.clerkId,
        email: profile.email,
        name: profile.name,
        imageUrl: profile.imageUrl,
        secret: sharedSecret,
      });
    }
  }

  // Unknown/unhandled event types are acknowledged so Clerk stops retrying.
  return new Response("ok", { status: 200 });
}
