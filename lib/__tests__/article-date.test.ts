import { describe, expect, it } from "vitest";
import { formatArticleDate } from "@/lib/article-date";

describe("formatArticleDate", () => {
  it("keeps the calendar date the author wrote, whatever the local zone", () => {
    // Midnight UTC is still the previous evening in the Americas.
    expect(formatArticleDate("2026-08-02")).toBe("Aug 2, 2026");
    expect(formatArticleDate("2026-07-27", "long")).toBe("July 27, 2026");
  });

  it("returns null for a missing or malformed date", () => {
    expect(formatArticleDate("")).toBeNull();
    expect(formatArticleDate("not a date")).toBeNull();
  });
});
