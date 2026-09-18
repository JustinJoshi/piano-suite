/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

const freeIdentity = {
  subject: "clerk_publish_free",
  email: "publish-free@example.com",
  name: "Publish Free",
};

const otherIdentity = {
  subject: "clerk_publish_other",
  email: "publish-other@example.com",
  name: "Publish Other",
};

function samplePage(overrides: Record<string, unknown> = {}) {
  return {
    clientPageId: "page-publish-1",
    title: "Scale Practice",
    blocks: [
      {
        id: "b1",
        type: "metronome",
        version: 1,
        config: { bpm: 120, beatsPerBar: 4, accentFirstBeat: true },
      },
    ],
    updatedAt: 1000,
    ...overrides,
  };
}

describe("free publishing", () => {
  describe("publishCustomDrill", () => {
    it("a signed-in user with no sync entitlement can publish and the row shows up in listPublicDrills", async () => {
      const t = convexTest(schema, modules);
      const asFree = t.withIdentity(freeIdentity);

      const result = await asFree.mutation(api.workshop.publishCustomDrill, {
        ...samplePage(),
      });
      expect(result._id).toBeTruthy();
      expect(result.updatedAt).toBe(1000);

      const list = await t.query(api.workshop.listPublicDrills, {});
      expect(list).toHaveLength(1);
      expect(list[0].title).toBe("Scale Practice");
      expect(list[0].authorName).toBe("Publish Free");
    });

    it("throws for an anonymous caller", async () => {
      const t = convexTest(schema, modules);
      await expect(
        t.mutation(api.workshop.publishCustomDrill, { ...samplePage() })
      ).rejects.toThrow(/authenticated/i);
    });

    it("throws when the user already has 25 published pages", async () => {
      const t = convexTest(schema, modules);
      const asFree = t.withIdentity(freeIdentity);

      for (let i = 1; i <= 25; i++) {
        await asFree.mutation(api.workshop.publishCustomDrill, {
          ...samplePage({ clientPageId: `page-pub-${i}`, updatedAt: i }),
        });
      }

      await expect(
        asFree.mutation(api.workshop.publishCustomDrill, {
          ...samplePage({ clientPageId: "page-pub-26" }),
        })
      ).rejects.toThrow(/25/);
    });

    it("republishing the same page does not count against the cap twice", async () => {
      const t = convexTest(schema, modules);
      const asFree = t.withIdentity(freeIdentity);

      await asFree.mutation(api.workshop.publishCustomDrill, {
        ...samplePage({ clientPageId: "page-pub-a" }),
      });
      await asFree.mutation(api.workshop.publishCustomDrill, {
        ...samplePage({ clientPageId: "page-pub-a", updatedAt: 2000 }),
      });

      const list = await t.query(api.workshop.listPublicDrills, {});
      expect(list).toHaveLength(1);
    });
  });

  describe("unpublishCustomDrill", () => {
    it("flips isPublic to false, drops it from the gallery, but keeps the row", async () => {
      const t = convexTest(schema, modules);
      const asFree = t.withIdentity(freeIdentity);

      const published = await asFree.mutation(api.workshop.publishCustomDrill, {
        ...samplePage(),
      });

      const result = await asFree.mutation(api.workshop.unpublishCustomDrill, {
        clientPageId: "page-publish-1",
      });
      expect(result.unpublished).toBe(true);

      const list = await t.query(api.workshop.listPublicDrills, {});
      expect(list).toHaveLength(0);

      const row = await t.run(async (ctx) =>
        ctx.db.get("customDrills", published._id)
      );
      expect(row).not.toBeNull();
      expect(row!.isPublic).toBe(false);
      expect(row!.deleted ?? false).toBe(false);
    });

    it("cannot unpublish a page owned by someone else", async () => {
      const t = convexTest(schema, modules);
      const asFree = t.withIdentity(freeIdentity);
      const asOther = t.withIdentity(otherIdentity);

      await asFree.mutation(api.workshop.publishCustomDrill, {
        ...samplePage(),
      });

      const result = await asOther.mutation(api.workshop.unpublishCustomDrill, {
        clientPageId: "page-publish-1",
      });
      expect(result.unpublished).toBe(false);

      const list = await t.query(api.workshop.listPublicDrills, {});
      expect(list).toHaveLength(1);
    });
  });

  describe("getPublishState", () => {
    it("returns the neutral value when there is no identity", async () => {
      const t = convexTest(schema, modules);
      const state = await t.query(api.workshop.getPublishState, {
        clientPageId: "page-publish-1",
      });
      expect(state).toEqual({ isPublic: false, drillId: null });
    });

    it("returns the neutral value when signed in with no users row", async () => {
      const t = convexTest(schema, modules);
      const asGhost = t.withIdentity({ subject: "clerk_publish_no_row" });
      const state = await asGhost.query(api.workshop.getPublishState, {
        clientPageId: "page-publish-1",
      });
      expect(state).toEqual({ isPublic: false, drillId: null });
    });

    it("returns the neutral value for a signed-in user whose page was never published", async () => {
      const t = convexTest(schema, modules);
      const asFree = t.withIdentity(freeIdentity);

      const state = await asFree.query(api.workshop.getPublishState, {
        clientPageId: "page-publish-1",
      });
      expect(state).toEqual({ isPublic: false, drillId: null });
    });

    it("returns the drill id for a published page", async () => {
      const t = convexTest(schema, modules);
      const asFree = t.withIdentity(freeIdentity);

      const published = await asFree.mutation(api.workshop.publishCustomDrill, {
        ...samplePage(),
      });

      const state = await asFree.query(api.workshop.getPublishState, {
        clientPageId: "page-publish-1",
      });
      expect(state.isPublic).toBe(true);
      expect(state.drillId).toBe(published._id);
    });
  });

  describe("Pro sync gate intact", () => {
    it("a Free user calling upsertCustomDrill still throws", async () => {
      const t = convexTest(schema, modules);
      const asFree = t.withIdentity(freeIdentity);

      await expect(
        asFree.mutation(api.workshop.upsertCustomDrill, {
          ...samplePage(),
          isPublic: true,
        })
      ).rejects.toThrow(/Pro required to sync/i);
    });
  });
});
