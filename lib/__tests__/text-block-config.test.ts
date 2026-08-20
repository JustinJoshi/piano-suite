import { describe, it, expect } from "vitest";
import { normalizeTextBlockConfig } from "@/lib/feature-blocks/text-block/config";

describe("textBlock config", () => {
  it("normalizes a valid config", () => {
    expect(normalizeTextBlockConfig({ text: "Practice hard" })).toEqual({
      text: "Practice hard",
    });
  });

  it("truncates long text", () => {
    const long = "x".repeat(3000);
    expect(normalizeTextBlockConfig({ text: long }).text).toHaveLength(2000);
  });

  it("falls back on invalid input", () => {
    expect(normalizeTextBlockConfig(null)).toEqual({
      text: "Enter your practice instructions here…",
    });
  });

  it("trims whitespace", () => {
    expect(normalizeTextBlockConfig({ text: "  hello  " })).toEqual({
      text: "hello",
    });
  });
});
