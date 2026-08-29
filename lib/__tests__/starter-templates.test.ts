import { describe, expect, it } from "vitest";
import {
  buildTemplatePage,
  normalizeStarterTemplate,
  starterTemplates,
} from "@/lib/starter-templates";

describe("starter templates", () => {
  it("ships a valid set of starter practice pages", () => {
    expect(starterTemplates).toHaveLength(10);

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
