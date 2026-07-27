import { describe, it, expect } from "vitest";
import {
  themes,
  themeIds,
  defaultTheme,
  isThemeId,
  findTheme,
} from "@/lib/themes";

describe("themes registry", () => {
  it("has a non-empty list of presets", () => {
    expect(themes.length).toBeGreaterThan(0);
    expect(themeIds.length).toBe(themes.length);
  });

  it("default theme is amber", () => {
    expect(defaultTheme).toBe("amber");
  });

  it("every theme has a unique id", () => {
    const ids = themes.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("isThemeId accepts valid theme ids and rejects invalid ones", () => {
    for (const id of themeIds) {
      expect(isThemeId(id)).toBe(true);
    }
    expect(isThemeId("neon")).toBe(false);
    expect(isThemeId("")).toBe(false);
  });

  it("findTheme returns the matching theme or undefined", () => {
    expect(findTheme("amber")?.name).toBe("Amber");
    expect(findTheme("neon")).toBeUndefined();
  });
});
