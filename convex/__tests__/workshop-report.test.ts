/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

const authorIdentity = {
  subject: "clerk_report_author",
  email: "report-author@example.com",
  name: "Report Author",
};

function samplePage(overrides: Record<string, unknown> = {}) {
  return {
    clientPageId: "page-report-1",
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

async function publishSamplePage() {
  const t = convexTest(schema, modules);
  const asAuthor = t.withIdentity(authorIdentity);
  const published = await asAuthor.mutation(api.workshop.publishCustomDrill, {
    ...samplePage(),
  });
  return { t, published };
}

describe("reportPublicDrill", () => {
  it("an anonymous report increments the report count", async () => {
    const { t, published } = await publishSamplePage();

    const result = await t.mutation(api.workshop.reportPublicDrill, {
      drillId: published._id,
    });
    expect(result.reportCount).toBe(1);
    expect(result.hidden).toBe(false);

    const row = await t.run(async (ctx) =>
      ctx.db.get("customDrills", published._id)
    );
    expect(row!.reportCount).toBe(1);
    expect(row!.hidden ?? false).toBe(false);
  });

  it("three reports hide the page", async () => {
    const { t, published } = await publishSamplePage();

    const first = await t.mutation(api.workshop.reportPublicDrill, {
      drillId: published._id,
      reason: "spam",
    });
    expect(first.hidden).toBe(false);

    const second = await t.mutation(api.workshop.reportPublicDrill, {
      drillId: published._id,
    });
    expect(second.hidden).toBe(false);

    const third = await t.mutation(api.workshop.reportPublicDrill, {
      drillId: published._id,
    });
    expect(third.reportCount).toBe(3);
    expect(third.hidden).toBe(true);
  });

  it("a hidden page is absent from listPublicDrills and getPublicDrill returns null", async () => {
    const { t, published } = await publishSamplePage();

    for (let i = 0; i < 3; i++) {
      await t.mutation(api.workshop.reportPublicDrill, {
        drillId: published._id,
      });
    }

    const list = await t.query(api.workshop.listPublicDrills, {});
    expect(list).toHaveLength(0);

    const single = await t.query(api.workshop.getPublicDrill, {
      drillId: published._id,
    });
    expect(single).toBeNull();
  });

  it("reporting a non-existent id throws cleanly", async () => {
    const { t, published } = await publishSamplePage();
    // Unpublish the page, then report it by its id — the handler must
    // reject rather than silently succeed.
    const asAuthor = t.withIdentity(authorIdentity);
    await asAuthor.mutation(api.workshop.unpublishCustomDrill, {
      clientPageId: "page-report-1",
    });

    await expect(
      t.mutation(api.workshop.reportPublicDrill, { drillId: published._id })
    ).rejects.toThrow(/Practice page not found/);
  });
});
