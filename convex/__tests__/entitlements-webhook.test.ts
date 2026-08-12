/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

const WEBHOOK_SECRET = "test-webhook-shared-secret";

describe("webhook entitlement mirror (WP2 hardening)", () => {
  beforeEach(() => {
    process.env.CLERK_WEBHOOK_SHARED_SECRET = WEBHOOK_SECRET;
  });

  afterEach(() => {
    delete process.env.CLERK_WEBHOOK_SHARED_SECRET;
  });

  it("rejects a wrong shared secret", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.users.applyWebhookEntitlement, {
        clerkId: "clerk_any",
        entitled: true,
        secret: "wrong-secret",
      })
    ).rejects.toThrow(/Invalid webhook secret/i);
  });

  it("is a no-op when no users row exists for the clerkId", async () => {
    const t = convexTest(schema, modules);
    const result = await t.mutation(api.users.applyWebhookEntitlement, {
      clerkId: "clerk_missing_row",
      entitled: true,
      secret: WEBHOOK_SECRET,
    });
    expect(result).toBeNull();
  });

  it("patches syncEntitled and entitlementSource on the user row", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({
      subject: "clerk_webhook_happy",
      email: "webhook@example.com",
      name: "Webhook User",
      pla: "u:pro",
      fea: "u:sync",
    });
    const userId = await asUser.mutation(api.users.ensureCurrentUser, {});

    const patched = await t.mutation(api.users.applyWebhookEntitlement, {
      clerkId: "clerk_webhook_happy",
      entitled: true,
      secret: WEBHOOK_SECRET,
    });
    expect(patched).toBe(userId);

    const row = await t.run(async (ctx) => ctx.db.get("users", userId));
    expect(row?.syncEntitled).toBe(true);
    expect(row?.entitlementSource).toBe("webhook");

    await t.mutation(api.users.applyWebhookEntitlement, {
      clerkId: "clerk_webhook_happy",
      entitled: false,
      secret: WEBHOOK_SECRET,
    });
    const revoked = await t.run(async (ctx) => ctx.db.get("users", userId));
    expect(revoked?.syncEntitled).toBe(false);
  });

  it("allows mutations with no JWT pla/fea when the row is webhook-entitled", async () => {
    const t = convexTest(schema, modules);

    // Bootstrap the row as Pro-with-claims, then simulate the webhook mirror
    // and a later session whose JWT lost the Billing claims (the silent
    // dashboard-misconfiguration failure this phase protects against).
    const asPro = t.withIdentity({
      subject: "clerk_webhook_gate",
      email: "gate@example.com",
      pla: "u:pro",
      fea: "u:sync",
    });
    await asPro.mutation(api.users.ensureCurrentUser, {});
    await t.mutation(api.users.applyWebhookEntitlement, {
      clerkId: "clerk_webhook_gate",
      entitled: true,
      secret: WEBHOOK_SECRET,
    });

    const asClaimsLess = t.withIdentity({
      subject: "clerk_webhook_gate",
      email: "gate@example.com",
      pla: "u:free_user",
      fea: "",
    });
    const eventId = await asClaimsLess.mutation(
      api.tracking.logChordDrillEvent,
      {
        chord: "G7",
        reactionTimeMs: 650,
        redo: false,
      }
    );
    expect(eventId).toBeTruthy();

    // Revoking the mirrored entitlement re-locks the same identity.
    await t.mutation(api.users.applyWebhookEntitlement, {
      clerkId: "clerk_webhook_gate",
      entitled: false,
      secret: WEBHOOK_SECRET,
    });
    await expect(
      asClaimsLess.mutation(api.tracking.logChordDrillEvent, {
        chord: "G7",
        reactionTimeMs: 650,
        redo: false,
      })
    ).rejects.toThrow(/Pro required/i);
  });
});
