import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({}),
  Fraunces: () => ({}),
  Geist_Mono: () => ({}),
}));

import { metadata } from "@/app/layout";

const description =
  "A free workshop for building your own piano practice. Start with a ready-made drill, or snap components together into the session you need today.";

describe("root metadata", () => {
  it("describes the workshop without mentioning Anki", () => {
    expect(metadata.description).toBe(description);
    expect(description).not.toMatch(/anki/i);
    expect(description).toMatch(/workshop/i);
  });

  it("keeps the description within search-result length bounds", () => {
    expect(description.length).toBeGreaterThanOrEqual(80);
    expect(description.length).toBeLessThanOrEqual(200);
  });

  it("exposes openGraph and twitter descriptions for shared links", () => {
    expect(metadata.openGraph).toBeDefined();
    expect(metadata.openGraph!.description).toBe(description);
    expect(metadata.twitter).toBeDefined();
    expect(metadata.twitter!.description).toBe(description);
  });
});
