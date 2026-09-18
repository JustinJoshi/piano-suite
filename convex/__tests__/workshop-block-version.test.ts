/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const modules = import.meta.glob("../**/*.ts");

const PRO_IDENTITY = {
  subject: "clerk_preview_block_version",
  email: "block-version@example.com",
  name: "Block Version User",
  pla: "u:pro",
  fea: "u:sync",
};

describe("workshop page block version survival", () => {
  it("a page stored with an out-of-date block version survives a write/read round trip", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity(PRO_IDENTITY);

    const clientPageId = "test-page-block-version";
    const updatedAt = Date.now();
    // `version: 0` is below every registered block version — the shape a
    // page written before versioning existed could carry.
    await asUser.mutation(api.workshop.upsertCustomDrill, {
      clientPageId,
      title: "Out-of-date page",
      blocks: [
        { id: "blk-1", type: "metronome", version: 0, config: { bpm: 96 } },
      ],
      updatedAt,
    });

    const pages = await asUser.query(api.workshop.listCustomDrills, {});
    const stored = pages.find((p) => p.clientPageId === clientPageId);
    expect(stored).toBeDefined();
    expect(stored?.blocks).toHaveLength(1);

    const block = stored?.blocks[0] as Record<string, unknown>;
    expect(block?.type).toBe("metronome");
    // The block is retained (not dropped) and re-stamped to the current
    // version, with its config normalized rather than discarded.
    expect(block?.version).toBe(1);
    expect(block?.config).toMatchObject({ bpm: 96 });
  });
});
