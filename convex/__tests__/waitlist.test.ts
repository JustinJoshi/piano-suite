/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

describe("waitlist", () => {
  it("lets an anonymous visitor join and reports position", async () => {
    const t = convexTest(schema, modules);

    const result = await t.mutation(api.waitlist.joinWaitlist, {
      email: "Pianist@Example.COM",
    });

    expect(result.status).toBe("joined");
    expect(result.position).toBe(1);
    expect(await t.query(api.waitlist.waitlistCount, {})).toBe(1);
  });

  it("assigns increasing positions to new signups", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.waitlist.joinWaitlist, { email: "a@example.com" });
    const second = await t.mutation(api.waitlist.joinWaitlist, {
      email: "b@example.com",
    });

    expect(second.status).toBe("joined");
    expect(second.position).toBe(2);
  });

  it("dedupes by normalized email without a second row", async () => {
    const t = convexTest(schema, modules);

    const first = await t.mutation(api.waitlist.joinWaitlist, {
      email: "dupe@example.com",
    });
    const repeat = await t.mutation(api.waitlist.joinWaitlist, {
      email: "  Dupe@Example.com ",
    });

    expect(repeat.status).toBe("alreadyJoined");
    expect(repeat.position).toBe(first.position);
    expect(await t.query(api.waitlist.waitlistCount, {})).toBe(1);
  });

  it("rejects malformed emails", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.waitlist.joinWaitlist, { email: "not-an-email" })
    ).rejects.toThrow();
    expect(await t.query(api.waitlist.waitlistCount, {})).toBe(0);
  });

  it("attaches the user row when signed in", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({
      subject: "clerk_waitlist_user",
      email: "signedin@example.com",
    });

    const result = await asUser.mutation(api.waitlist.joinWaitlist, {
      email: "signedin@example.com",
      source: "post-drill",
    });

    expect(result.status).toBe("joined");

    const row = await t.query(api.waitlist.waitlistSignupByEmail, {
      email: "signedin@example.com",
    });
    expect(row).not.toBeNull();
    expect(row?.userId).toBeDefined();
    expect(row?.source).toBe("post-drill");
  });

  it("counts stay accurate across mixed signups", async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.waitlist.joinWaitlist, { email: "x@example.com" });
    await t.mutation(api.waitlist.joinWaitlist, { email: "x@example.com" });
    await t.mutation(api.waitlist.joinWaitlist, { email: "y@example.com" });

    expect(await t.query(api.waitlist.waitlistCount, {})).toBe(2);
  });
});
