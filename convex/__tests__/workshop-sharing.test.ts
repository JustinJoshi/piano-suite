/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

const proIdentity = {
  subject: "clerk_workshop_share_pro",
  email: "workshop-share@example.com",
  name: "Workshop Share Pro",
  pla: "u:pro",
  fea: "u:sync",
};

const freeIdentity = {
  subject: "clerk_workshop_share_free",
  email: "workshop-share-free@example.com",
  name: "Workshop Free",
};

function samplePage(overrides: Record<string, unknown> = {}) {
  return {
    clientPageId: "page-share-1",
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

describe("workshop sharing", () => {
  describe("listPublicDrills", () => {
    it("returns [] when no drills are published", async () => {
      const t = convexTest(schema, modules);
      expect(await t.query(api.workshop.listPublicDrills, {})).toEqual([]);
    });
  });

  describe("getPublicDrill", () => {
    it("returns null for a deleted drill", async () => {
      const t = convexTest(schema, modules);
      const asPro = t.withIdentity(proIdentity);

      const r1 = await asPro.mutation(api.workshop.upsertCustomDrill, {
        ...samplePage({ clientPageId: "page-del" }),
        isPublic: true,
      });

      await asPro.mutation(api.workshop.deleteCustomDrill, {
        clientPageId: "page-del",
        updatedAt: 9999,
      });

      const result = await t.query(api.workshop.getPublicDrill, {
        drillId: r1._id,
      });
      expect(result).toBeNull();
    });
  });

  describe("upsertCustomDrill with isPublic", () => {
    it("publishes a drill and returns its _id", async () => {
      const t = convexTest(schema, modules);
      const asPro = t.withIdentity(proIdentity);

      const result = await asPro.mutation(api.workshop.upsertCustomDrill, {
        ...samplePage(),
        isPublic: true,
      });
      expect(result.accepted).toBe(true);
      expect(result._id).toBeTruthy();

      const published = await t.query(api.workshop.getPublicDrill, {
        drillId: result._id,
      });
      expect(published).not.toBeNull();
      expect(published!.title).toBe("Scale Practice");
      expect(published!.authorName).toBe("Workshop Share Pro");
    });

    it("unpublishes a drill", async () => {
      const t = convexTest(schema, modules);
      const asPro = t.withIdentity(proIdentity);

      const r1 = await asPro.mutation(api.workshop.upsertCustomDrill, {
        ...samplePage(),
        isPublic: true,
      });

      await asPro.mutation(api.workshop.upsertCustomDrill, {
        ...samplePage(),
        updatedAt: 2000,
        isPublic: false,
      });

      const result = await t.query(api.workshop.getPublicDrill, {
        drillId: r1._id,
      });
      expect(result).toBeNull();
    });

    it("deleting a published drill unpublishes it", async () => {
      const t = convexTest(schema, modules);
      const asPro = t.withIdentity(proIdentity);

      const r1 = await asPro.mutation(api.workshop.upsertCustomDrill, {
        ...samplePage(),
        isPublic: true,
      });

      await asPro.mutation(api.workshop.deleteCustomDrill, {
        clientPageId: "page-share-1",
        updatedAt: 5000,
      });

      const result = await t.query(api.workshop.getPublicDrill, {
        drillId: r1._id,
      });
      expect(result).toBeNull();
    });
  });

  describe("forkCustomDrill", () => {
    it("forks a public drill into another user's collection", async () => {
      const t = convexTest(schema, modules);
      const asPro = t.withIdentity(proIdentity);
      const asFree = t.withIdentity(freeIdentity);

      const r1 = await asPro.mutation(api.workshop.upsertCustomDrill, {
        ...samplePage(),
        isPublic: true,
      });

      const fork = await asFree.mutation(api.workshop.forkCustomDrill, {
        drillId: r1._id,
      });
      expect(fork).not.toBeNull();
      expect(fork!.title).toBe("Scale Practice");
      expect(fork!.blocks).toHaveLength(1);

      const forkedDrill = await t.query(api.workshop.getPublicDrill, {
        drillId: fork!._id,
      });
      expect(forkedDrill).toBeNull();
    });

    it("returns null for non-public drills", async () => {
      const t = convexTest(schema, modules);
      const asPro = t.withIdentity(proIdentity);
      const asFree = t.withIdentity(freeIdentity);

      const r1 = await asPro.mutation(api.workshop.upsertCustomDrill, {
        ...samplePage(),
        isPublic: false,
      });

      const fork = await asFree.mutation(api.workshop.forkCustomDrill, {
        drillId: r1._id,
      });
      expect(fork).toBeNull();
    });

    it("flattens forkedFrom to root original", async () => {
      const t = convexTest(schema, modules);
      const asPro = t.withIdentity(proIdentity);

      // Create original drill (pro user).
      const r1 = await asPro.mutation(api.workshop.upsertCustomDrill, {
        ...samplePage(),
        isPublic: true,
      });

      // Fork it (same pro user for simplicity).
      const fork1 = await asPro.mutation(api.workshop.forkCustomDrill, {
        drillId: r1._id,
      });
      expect(fork1).not.toBeNull();

      // Publish fork1 so it can be forked again.
      await asPro.mutation(api.workshop.upsertCustomDrill, {
        clientPageId: fork1!.clientPageId,
        title: fork1!.title,
        blocks: fork1!.blocks,
        updatedAt: Date.now(),
        isPublic: true,
      });

      // Fork fork1.
      const fork2 = await asPro.mutation(api.workshop.forkCustomDrill, {
        drillId: fork1!._id,
      });
      expect(fork2).not.toBeNull();

      // forkedFrom should be the original r1._id, not fork1._id.
      const fork2Drill = await t.run(async (ctx) =>
        ctx.db.get("customDrills", fork2!._id)
      );
      expect(fork2Drill!.forkedFrom).toBe(r1._id);
    });
  });

  describe("listPublicDrills", () => {
    it("lists published drills and excludes tombstoned/deleted ones", async () => {
      const t = convexTest(schema, modules);
      const asPro = t.withIdentity(proIdentity);

      await asPro.mutation(api.workshop.upsertCustomDrill, {
        ...samplePage(),
        isPublic: true,
      });

      const list = await t.query(api.workshop.listPublicDrills, {});
      expect(list).toHaveLength(1);
      expect(list[0].title).toBe("Scale Practice");

      await asPro.mutation(api.workshop.deleteCustomDrill, {
        clientPageId: "page-share-1",
        updatedAt: 10000,
      });

      const listAfter = await t.query(api.workshop.listPublicDrills, {});
      expect(listAfter).toHaveLength(0);
    });
  });
});
