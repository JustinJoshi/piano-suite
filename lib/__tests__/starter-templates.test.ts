import { describe, expect, it } from "vitest";
import {
  buildTemplatePage,
  normalizeStarterTemplate,
  starterTemplates,
} from "@/lib/starter-templates";
import { buildStream } from "@/lib/feature-blocks/build-stream";
import { validatePageWiring } from "@/lib/feature-blocks/manifest";
import { isTargetBlockType } from "@/lib/feature-blocks/target-blocks";

describe("starter templates", () => {
  it("ships a valid set of starter practice pages", () => {
    expect(starterTemplates.length).toBeGreaterThanOrEqual(10);

    const ids = starterTemplates.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const template of starterTemplates) {
      const normalized = normalizeStarterTemplate(template);
      expect(normalized?.id).toBe(template.id);
      expect(normalized?.blocks.length).toBeGreaterThan(0);
    }
  });

  it("includes the guided-route workshop seeds", () => {
    const ids = starterTemplates.map((template) => template.id);
    expect(ids).toContain("music-theory-starter");
    expect(ids).toContain("finger-flexibility-starter");
  });

  it("keeps every template to one target block", () => {
    for (const template of starterTemplates) {
      const targets = template.blocks.filter((b) =>
        isTargetBlockType(b.type)
      );
      expect(targets.length).toBeLessThanOrEqual(1);
    }
  });

  it("creates a page with fresh ids without changing the template", () => {
    const template = starterTemplates[0];
    const page = buildTemplatePage(template);

    expect(page.id).not.toBe(template.id);
    expect(page.title).toBe(template.title);
    expect(page.blocks.map((item) => item.id)).not.toEqual(
      template.blocks.map((item) => item.id)
    );
    expect(template.blocks[0].config).not.toBe(page.blocks[0].config);
  });

  it("rejects unknown templates and invalid block payloads", () => {
    expect(normalizeStarterTemplate({ ...starterTemplates[0], id: "unknown" })).toBeNull();
    expect(
      normalizeStarterTemplate({
        ...starterTemplates[0],
        blocks: [{ id: "bad", type: "unknown", version: 1, config: {} }],
      })
    ).toBeNull();
  });
});

describe("stage 1 template content", () => {
  const stageOneIds = [
    "hanon-cell-warmup",
    "rootless-ii-v-i",
    "pentatonic-improv",
  ];

  function byId(id: string) {
    const template = starterTemplates.find((t) => t.id === id);
    if (!template) throw new Error(`missing template: ${id}`);
    return template;
  }

  it("includes the three Stage 1 starter templates", () => {
    const ids = starterTemplates.map((template) => template.id);
    for (const id of stageOneIds) {
      expect(ids).toContain(id);
    }
    expect(starterTemplates.length).toBeGreaterThanOrEqual(22);
  });

  it("composes a non-empty stream for every Stage 1 template", () => {
    for (const id of stageOneIds) {
      expect(buildStream(byId(id).blocks).length).toBeGreaterThan(0);
    }
  });

  it("passes validatePageWiring with zero issues for every Stage 1 template", () => {
    for (const id of stageOneIds) {
      expect(validatePageWiring(byId(id).blocks)).toEqual([]);
    }
  });
});
