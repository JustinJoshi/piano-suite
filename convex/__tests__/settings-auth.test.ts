/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

describe("settings auth resilience", () => {
  it("getSetting returns null when there is no identity", async () => {
    const t = convexTest(schema, modules);
    const value = await t.query(api.settings.getSetting, { key: "theme" });
    expect(value).toBeNull();
  });

  it("getSetting returns null when signed in but user row is missing", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "clerk_preview_new_user" });
    const value = await asUser.query(api.settings.getSetting, { key: "theme" });
    expect(value).toBeNull();
  });

  it("setSetting creates the user row and persists the value for Pro", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({
      subject: "clerk_preview_set_setting",
      email: "preview@example.com",
      name: "Preview User",
      pla: "u:pro",
      fea: "u:sync",
    });

    await asUser.mutation(api.settings.setSetting, {
      key: "theme",
      value: "rose",
    });

    const value = await asUser.query(api.settings.getSetting, { key: "theme" });
    expect(value).toBe("rose");
  });
});
