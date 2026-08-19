/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

const proIdentity = {
  subject: "clerk_workshop_pro",
  email: "workshop@example.com",
  name: "Workshop Pro",
  pla: "u:pro",
  fea: "u:sync",
};

describe("workshop tracking", () => {
  it("logs and lists generic practice events by tool", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    await asPro.mutation(api.tracking.logPracticeEvent, {
      tool: "workshop",
      chord: "Cmaj7",
      reactionTimeMs: 900,
      grade: "Good",
      redo: false,
      pageId: "page-1",
    });

    await asPro.mutation(api.tracking.logPracticeEvent, {
      tool: "workshop",
      chord: "Dm7",
      reactionTimeMs: 1100,
      grade: "Hard",
      redo: false,
      pageId: "page-1",
    });

    const events = await asPro.query(api.tracking.listPracticeEventsByTool, {
      tool: "workshop",
    });
    expect(events).toHaveLength(2);
    expect(events[0]?.chord).toBe("Dm7");
    expect(events[0]?.pageId).toBe("page-1");
    expect(events[1]?.chord).toBe("Cmaj7");
  });

  it("logs and lists generic miss events by tool", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    await asPro.mutation(api.tracking.logMissEvent, {
      tool: "workshop",
      chord: "Cmaj7",
      played: "C,E,G",
      pageId: "page-1",
    });

    const misses = await asPro.query(api.tracking.listMissEventsByTool, {
      tool: "workshop",
    });
    expect(misses).toHaveLength(1);
    expect(misses[0]?.chord).toBe("Cmaj7");
    expect(misses[0]?.played).toBe("C,E,G");
    expect(misses[0]?.pageId).toBe("page-1");
  });

  it("returns empty for unsigned users", async () => {
    const t = convexTest(schema, modules);

    const events = await t.query(api.tracking.listPracticeEventsByTool, {
      tool: "workshop",
    });
    expect(events).toHaveLength(0);

    const misses = await t.query(api.tracking.listMissEventsByTool, {
      tool: "workshop",
    });
    expect(misses).toHaveLength(0);
  });

  it("clearPracticeEventsByPage deletes only matching page events", async () => {
    const t = convexTest(schema, modules);
    const asPro = t.withIdentity(proIdentity);

    await asPro.mutation(api.tracking.logPracticeEvent, {
      tool: "workshop",
      chord: "Cmaj7",
      reactionTimeMs: 900,
      redo: false,
      pageId: "page-a",
    });
    await asPro.mutation(api.tracking.logPracticeEvent, {
      tool: "workshop",
      chord: "Dm7",
      reactionTimeMs: 800,
      redo: false,
      pageId: "page-b",
    });
    await asPro.mutation(api.tracking.logMissEvent, {
      tool: "workshop",
      chord: "Cmaj7",
      played: "C,E",
      pageId: "page-a",
    });

    await asPro.mutation(api.tracking.clearPracticeEventsByPage, {
      tool: "workshop",
      pageId: "page-a",
    });

    const events = await asPro.query(api.tracking.listPracticeEventsByTool, {
      tool: "workshop",
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.pageId).toBe("page-b");

    const misses = await asPro.query(api.tracking.listMissEventsByTool, {
      tool: "workshop",
    });
    expect(misses).toHaveLength(0);
  });
});
