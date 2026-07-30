/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

describe("practice mutation Pro enforcement (WP2)", () => {
  it("rejects Free signed-in users without sync/pro claims", async () => {
    const t = convexTest(schema, modules);
    const asFree = t.withIdentity({
      subject: "clerk_free_user",
      email: "free@example.com",
      name: "Free User",
      pla: "u:free_user",
      fea: "",
    });

    await expect(
      asFree.mutation(api.tracking.logChordDrillEvent, {
        chord: "Cmaj7",
        reactionTimeMs: 900,
        redo: false,
      })
    ).rejects.toThrow(/Pro required/i);

    await expect(
      asFree.mutation(api.technique.logTechniqueSession, {
        date: "2026-07-29",
        exercise: "Czerny",
        bpm: 60,
      })
    ).rejects.toThrow(/Pro required/i);
  });

  it("allows Pro users with fea sync claim", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity({
      subject: "clerk_pro_sync",
      email: "pro@example.com",
      name: "Pro User",
      pla: "u:pro",
      fea: "u:sync",
    });

    const eventId = await asPro.mutation(api.tracking.logChordDrillEvent, {
      chord: "Dm7",
      reactionTimeMs: 700,
      redo: false,
    });
    expect(eventId).toBeTruthy();

    const techId = await asPro.mutation(api.technique.logTechniqueSession, {
      date: "2026-07-29",
      exercise: "Czerny",
      bpm: 72,
    });
    expect(techId).toBeTruthy();

    const events = await asPro.query(api.tracking.listChordDrillEvents, {});
    expect(events).toHaveLength(1);
    expect(events[0]?.chord).toBe("Dm7");
  });

  it("allows Pro users with pla pro even if fea is empty", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity({
      subject: "clerk_pro_plan_only",
      email: "proplan@example.com",
      pla: "u:pro",
    });

    const eventId = await asPro.mutation(api.tracking.logRootCycleEvent, {
      mode: "chord",
      label: "Cmaj7",
      root: "C",
      reactionTimeMs: 800,
    });
    expect(eventId).toBeTruthy();
  });

  it("rejects Free users setting theme (WP6 prefs require sync)", async () => {
    const t = convexTest(schema, modules);
    const asFree = t.withIdentity({
      subject: "clerk_free_settings",
      email: "freesettings@example.com",
      pla: "u:free_user",
    });

    await expect(
      asFree.mutation(api.settings.setSetting, {
        key: "theme",
        value: "rose",
      })
    ).rejects.toThrow(/Pro required/i);
  });

  it("allows Pro users to set theme settings", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity({
      subject: "clerk_pro_settings",
      email: "prosettings@example.com",
      pla: "u:pro",
      fea: "u:sync",
    });

    await asPro.mutation(api.settings.setSetting, {
      key: "theme",
      value: "rose",
    });
    const value = await asPro.query(api.settings.getSetting, { key: "theme" });
    expect(value).toBe("rose");
  });
});
