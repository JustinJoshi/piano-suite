/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

const proIdentity = {
  subject: "clerk_workshop_drills_pro",
  email: "workshop-drills@example.com",
  name: "Workshop Drills Pro",
  pla: "u:pro",
  fea: "u:sync",
};

const freeIdentity = {
  subject: "clerk_workshop_drills_free",
  email: "workshop-free@example.com",
  name: "Workshop Free",
};

function samplePage(overrides: Record<string, unknown> = {}) {
  return {
    clientPageId: "page-1",
    title: "Warmup",
    blocks: [
      {
        id: "block-1",
        type: "metronome",
        version: 1,
        config: { bpm: 120, beatsPerBar: 4, accentFirstBeat: true },
      },
    ],
    updatedAt: 1000,
    ...overrides,
  };
}

describe("workshop customDrills sync", () => {
  it("returns [] for signed-out users", async () => {
    const t = convexTest(schema, modules);
    expect(await t.query(api.workshop.listCustomDrills, {})).toEqual([]);
  });

  it("rejects writes from free users", async () => {
    const t = convexTest(schema, modules);
    const asFree = t.withIdentity(freeIdentity);

    await expect(
      asFree.mutation(api.workshop.upsertCustomDrill, samplePage())
    ).rejects.toThrow();
  });

  it("round-trips a page for a pro user", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    const result = await asPro.mutation(
      api.workshop.upsertCustomDrill,
      samplePage()
    );
    expect(result.accepted).toBe(true);

    const rows = await asPro.query(api.workshop.listCustomDrills, {});
    expect(rows).toHaveLength(1);
    expect(rows[0].clientPageId).toBe("page-1");
    expect(rows[0].title).toBe("Warmup");
    expect(rows[0].deleted).toBe(false);
    expect(rows[0].blocks[0].type).toBe("metronome");
  });

  it("ignores stale writes (last-write-wins)", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    await asPro.mutation(
      api.workshop.upsertCustomDrill,
      samplePage({ updatedAt: 2000, title: "Newer" })
    );

    const stale = await asPro.mutation(
      api.workshop.upsertCustomDrill,
      samplePage({ updatedAt: 1000, title: "Stale tab" })
    );
    expect(stale.accepted).toBe(false);
    expect(stale.updatedAt).toBe(2000);

    const rows = await asPro.query(api.workshop.listCustomDrills, {});
    expect(rows[0].title).toBe("Newer");
  });

  it("drops unknown block types and clamps titles on save", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    await asPro.mutation(api.workshop.upsertCustomDrill, {
      clientPageId: "page-2",
      title: "   ".repeat(100),
      blocks: [
        { id: "b1", type: "not-a-real-block", version: 1, config: {} },
        { id: "b2", type: "drillTimer", version: 1, config: {} },
        { id: "b3", type: "chordSet", version: 1, config: {} },
      ],
      updatedAt: 1000,
    });

    const rows = await asPro.query(api.workshop.listCustomDrills, {});
    expect(rows[0].title).toBe("My Practice Page");
    expect(rows[0].blocks.map((b: { id: string }) => b.id)).toEqual([
      "b2",
      "b3",
    ]);
  });

  it("rejects invalid envelopes", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    await expect(
      asPro.mutation(api.workshop.upsertCustomDrill, {
        clientPageId: "",
        title: "Bad id",
        blocks: [],
        updatedAt: 1000,
      })
    ).rejects.toThrow();

    await expect(
      asPro.mutation(api.workshop.upsertCustomDrill, {
        clientPageId: "page-3",
        title: "Too many blocks",
        blocks: Array.from({ length: 31 }, (_, i) => ({
          id: `b${i}`,
          type: "metronome",
          version: 1,
          config: {},
        })),
        updatedAt: 1000,
      })
    ).rejects.toThrow();
  });

  it("tombstones deletions and propagates them via list", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    await asPro.mutation(api.workshop.upsertCustomDrill, samplePage());
    await asPro.mutation(api.workshop.deleteCustomDrill, {
      clientPageId: "page-1",
      updatedAt: 3000,
    });

    const rows = await asPro.query(api.workshop.listCustomDrills, {});
    expect(rows).toHaveLength(1);
    expect(rows[0].deleted).toBe(true);
  });

  it("tombstones a page that was never uploaded (idempotent)", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    await asPro.mutation(api.workshop.deleteCustomDrill, {
      clientPageId: "never-uploaded",
      updatedAt: 1000,
    });

    const rows = await asPro.query(api.workshop.listCustomDrills, {});
    expect(rows).toHaveLength(1);
    expect(rows[0].deleted).toBe(true);
  });

  it("can recreate a page after a tombstone (newer upsert wins)", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    await asPro.mutation(api.workshop.upsertCustomDrill, samplePage());
    await asPro.mutation(api.workshop.deleteCustomDrill, {
      clientPageId: "page-1",
      updatedAt: 3000,
    });
    const revived = await asPro.mutation(
      api.workshop.upsertCustomDrill,
      samplePage({ updatedAt: 4000, title: "Revived" })
    );
    expect(revived.accepted).toBe(true);

    const rows = await asPro.query(api.workshop.listCustomDrills, {});
    expect(rows).toHaveLength(1);
    expect(rows[0].deleted).toBe(false);
    expect(rows[0].title).toBe("Revived");
  });

  it("never leaks pages across users", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);
    const asOther = t.withIdentity({
      ...proIdentity,
      subject: "clerk_workshop_other_pro",
    });

    await asPro.mutation(api.workshop.upsertCustomDrill, samplePage());

    const otherRows = await asOther.query(api.workshop.listCustomDrills, {});
    expect(otherRows).toEqual([]);
  });
});
