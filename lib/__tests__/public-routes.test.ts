import { describe, it, expect } from "vitest";
import { isPublicPath } from "@/lib/public-routes";

describe("isPublicPath", () => {
  it("keeps the marketing front door public", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/pricing")).toBe(true);
    expect(isPublicPath("/articles")).toBe(true);
    expect(isPublicPath("/articles/some-slug")).toBe(true);
    expect(isPublicPath("/routes")).toBe(true);
    expect(isPublicPath("/routes/zero-to-playing")).toBe(true);
    expect(isPublicPath("/terms")).toBe(true);
    expect(isPublicPath("/privacy")).toBe(true);
  });

  it("keeps Pattern Lab and the dev lab public", () => {
    expect(isPublicPath("/tools/chladni")).toBe(true);
    expect(isPublicPath("/dev/welcome-lab")).toBe(true);
  });

  it("opens the workshop and its marketplace to anonymous visitors", () => {
    expect(isPublicPath("/tools/workshop")).toBe(true);
    expect(isPublicPath("/tools/workshop/marketplace")).toBe(true);
  });

  it("keeps every other tool behind sign-in", () => {
    expect(isPublicPath("/tools")).toBe(false);
    expect(isPublicPath("/tools/")).toBe(false);
    expect(isPublicPath("/tools/workshop-extra")).toBe(false);
    expect(isPublicPath("/tools/chord-drill")).toBe(false);
    expect(isPublicPath("/tools/arpeggios")).toBe(false);
    expect(isPublicPath("/tools/chladni-ripple")).toBe(false);
    expect(isPublicPath("/tools/tracking")).toBe(false);
    expect(isPublicPath("/settings/theme")).toBe(false);
    expect(isPublicPath("/chat")).toBe(false);
  });

  it("keeps auth, api, clerk, and community gallery surfaces public", () => {
    expect(isPublicPath("/sign-in")).toBe(true);
    expect(isPublicPath("/sign-in/sso-code")).toBe(true);
    expect(isPublicPath("/sign-up")).toBe(true);
    expect(isPublicPath("/api/chat")).toBe(true);
    expect(isPublicPath("/workshop")).toBe(true);
    expect(isPublicPath("/workshop/some-drill-id")).toBe(true);
  });

  it("does not public-prefix near-miss routes", () => {
    expect(isPublicPath("/pricing-extra")).toBe(false);
    expect(isPublicPath("/articles-extra")).toBe(false);
    expect(isPublicPath("/workshop-extra")).toBe(false);
    expect(isPublicPath("/devtools")).toBe(false);
  });
});
