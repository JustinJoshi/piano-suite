import { describe, expect, it } from "vitest";
import {
  entitlementFromWebhookEvent,
  profileFromWebhookUser,
} from "@/lib/clerk-webhook";

const proPlan = { id: "plan_pro", slug: "pro", is_default: false };
const freePlan = { id: "plan_free", slug: "free_user", is_default: true };
const syncFeaturePlan = {
  id: "plan_pro",
  slug: "premium_annual",
  features: [{ slug: "sync" }],
};

describe("entitlementFromWebhookEvent", () => {
  it("marks an active Pro subscriptionItem as entitled", () => {
    const result = entitlementFromWebhookEvent({
      type: "subscriptionItem.active",
      data: {
        status: "active",
        plan: proPlan,
        payer: { user_id: "user_123" },
      },
    });
    expect(result).toEqual({ clerkId: "user_123", entitled: true });
  });

  it("treats the sync feature slug as entitled even on another plan slug", () => {
    const result = entitlementFromWebhookEvent({
      type: "subscriptionItem.updated",
      data: {
        status: "active",
        plan: syncFeaturePlan,
        payer: { user_id: "user_123" },
      },
    });
    expect(result).toEqual({ clerkId: "user_123", entitled: true });
  });

  it("keeps canceled and past_due items entitled (access until period end)", () => {
    for (const status of ["canceled", "past_due"]) {
      const result = entitlementFromWebhookEvent({
        type: "subscriptionItem.updated",
        data: { status, plan: proPlan, payer: { user_id: "user_123" } },
      });
      expect(result).toEqual({ clerkId: "user_123", entitled: true });
    }
  });

  it("marks free-plan and ended items as not entitled", () => {
    const free = entitlementFromWebhookEvent({
      type: "subscriptionItem.active",
      data: {
        status: "active",
        plan: freePlan,
        payer: { user_id: "user_123" },
      },
    });
    expect(free).toEqual({ clerkId: "user_123", entitled: false });

    const ended = entitlementFromWebhookEvent({
      type: "subscriptionItem.ended",
      data: {
        status: "ended",
        plan: proPlan,
        payer: { user_id: "user_123" },
      },
    });
    expect(ended).toEqual({ clerkId: "user_123", entitled: false });
  });

  it("recomputes from the items list on top-level subscription events", () => {
    const entitled = entitlementFromWebhookEvent({
      type: "subscription.active",
      data: {
        payer: { user_id: "user_123" },
        items: [
          { status: "ended", plan: proPlan },
          { status: "active", plan: proPlan },
        ],
      },
    });
    expect(entitled).toEqual({ clerkId: "user_123", entitled: true });

    const freeOnly = entitlementFromWebhookEvent({
      type: "subscription.updated",
      data: {
        payer_id: "user_123",
        items: [{ status: "active", plan: freePlan }],
      },
    });
    expect(freeOnly).toEqual({ clerkId: "user_123", entitled: false });
  });

  it("ignores non-subscription events so the route just acks them", () => {
    expect(
      entitlementFromWebhookEvent({ type: "user.updated", data: {} })
    ).toBeNull();
    expect(
      entitlementFromWebhookEvent({ type: "paymentAttempt.updated", data: {} })
    ).toBeNull();
    expect(entitlementFromWebhookEvent({ type: undefined, data: {} })).toBeNull();
    expect(entitlementFromWebhookEvent({})).toBeNull();
  });

  it("ignores subscription payloads without a payer user id", () => {
    expect(
      entitlementFromWebhookEvent({
        type: "subscriptionItem.active",
        data: { status: "active", plan: proPlan, payer: {} },
      })
    ).toBeNull();
  });
});

describe("profileFromWebhookUser", () => {
  it("maps UserJSON fields onto the users row shape", () => {
    const result = profileFromWebhookUser({
      id: "user_123",
      first_name: "Ada",
      last_name: "Lovelace",
      image_url: "https://img.clerk.com/ada.png",
      primary_email_address_id: "idn_2",
      email_addresses: [
        { id: "idn_1", email_address: "alt@example.com" },
        { id: "idn_2", email_address: "ada@example.com" },
      ],
    });
    expect(result).toEqual({
      clerkId: "user_123",
      email: "ada@example.com",
      name: "Ada Lovelace",
      imageUrl: "https://img.clerk.com/ada.png",
    });
  });

  it("omits fields that are null or empty in the payload", () => {
    const result = profileFromWebhookUser({
      id: "user_123",
      first_name: null,
      last_name: null,
      image_url: "",
      primary_email_address_id: null,
      email_addresses: [],
    });
    expect(result).toEqual({ clerkId: "user_123" });
  });

  it("returns null without a user id", () => {
    expect(profileFromWebhookUser({ first_name: "Ada" })).toBeNull();
    expect(profileFromWebhookUser(null)).toBeNull();
  });
});
