/**
 * Pure helpers for the Clerk webhook route (`app/api/webhooks/clerk/route.ts`).
 *
 * Kept free of svix / network / env access so the event → entitlement
 * decision is unit-testable without mocking signature verification.
 *
 * Event names and payload shapes per Clerk docs:
 * - Billing webhooks: https://clerk.com/docs/nextjs/guides/development/webhooks/billing
 *   (`subscription.*`, `subscriptionItem.*`, `paymentAttempt.*`)
 * - Webhook JSON types: `@clerk/backend` `BillingSubscriptionItemWebhookEventJSON`,
 *   `BillingSubscriptionWebhookEventJSON`, `UserJSON`.
 */

import { PRO_PLAN_SLUG, SYNC_FEATURE_SLUG } from "./billing";

export type WebhookEventLike = {
  type?: unknown;
  data?: unknown;
};

export type WebhookEntitlement = {
  clerkId: string;
  entitled: boolean;
};

export type WebhookProfile = {
  clerkId: string;
  email?: string;
  name?: string;
  imageUrl?: string;
};

/**
 * Statuses where the payer still holds the plan's features. `canceled`
 * retains features until the end of the billing period, and `past_due`
 * keeps access during the dunning grace period; `ended` / `abandoned` /
 * `incomplete` / `upcoming` do not grant access.
 * https://clerk.com/docs/nextjs/guides/development/webhooks/billing
 */
const ENTITLED_ITEM_STATUSES = new Set(["active", "canceled", "past_due"]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function planGrantsSync(plan: unknown): boolean {
  const record = asRecord(plan);
  if (!record) return false;
  if (record.slug === PRO_PLAN_SLUG) return true;
  const features = record.features;
  if (Array.isArray(features)) {
    return features.some(
      (feature) => asRecord(feature)?.slug === SYNC_FEATURE_SLUG
    );
  }
  return false;
}

function itemGrantsSync(item: unknown): boolean {
  const record = asRecord(item);
  if (!record) return false;
  const status = record.status;
  return (
    typeof status === "string" &&
    ENTITLED_ITEM_STATUSES.has(status) &&
    planGrantsSync(record.plan)
  );
}

function payerUserId(data: Record<string, unknown>): string | null {
  const payer = asRecord(data.payer);
  const userId = payer?.user_id ?? data.payer_id;
  return typeof userId === "string" && userId ? userId : null;
}

/**
 * Recompute the payer's Pro sync entitlement from any subscription-related
 * Clerk Billing webhook (`subscriptionItem.*` or `subscription.*`).
 * Returns null for non-subscription events or payloads without a user id,
 * which the route should acknowledge with 200 and otherwise ignore.
 */
export function entitlementFromWebhookEvent(
  event: WebhookEventLike
): WebhookEntitlement | null {
  const type = event?.type;
  const data = asRecord(event?.data);
  if (typeof type !== "string" || !data) return null;

  if (type.startsWith("subscriptionItem.")) {
    const clerkId = payerUserId(data);
    if (!clerkId) return null;
    return { clerkId, entitled: itemGrantsSync(data) };
  }

  if (type.startsWith("subscription.")) {
    const clerkId = payerUserId(data);
    if (!clerkId) return null;
    const items = Array.isArray(data.items) ? data.items : [];
    const entitled = items.some((item) => itemGrantsSync(item));
    return { clerkId, entitled };
  }

  return null;
}

/**
 * Map a Clerk `user.updated` payload (UserJSON) onto our `users` row fields,
 * mirroring `syncUserProfile` in `convex/lib/auth.ts`. Returns null when the
 * payload has no user id.
 */
export function profileFromWebhookUser(data: unknown): WebhookProfile | null {
  const record = asRecord(data);
  if (!record) return null;
  const clerkId = record.id;
  if (typeof clerkId !== "string" || !clerkId) return null;

  const first = typeof record.first_name === "string" ? record.first_name : "";
  const last = typeof record.last_name === "string" ? record.last_name : "";
  const name = [first, last].filter(Boolean).join(" ").trim() || undefined;

  const imageUrl =
    typeof record.image_url === "string" && record.image_url
      ? record.image_url
      : undefined;

  let email: string | undefined;
  const addresses = Array.isArray(record.email_addresses)
    ? record.email_addresses
    : [];
  const primaryId = record.primary_email_address_id;
  const primary =
    addresses.find((entry) => asRecord(entry)?.id === primaryId) ??
    addresses[0];
  const primaryAddress = asRecord(primary)?.email_address;
  if (typeof primaryAddress === "string" && primaryAddress) {
    email = primaryAddress;
  }

  return { clerkId, email, name, imageUrl };
}
