import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "../site-url";

describe("resolveSiteUrl", () => {
  it("prefers explicit NEXT_PUBLIC_SITE_URL with a scheme over both Vercel vars", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://pianosuite.example",
        VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
        VERCEL_URL: "preview.vercel.app",
      }),
    ).toBe("https://pianosuite.example");
  });

  it("prefixes NEXT_PUBLIC_SITE_URL with https:// when it has no scheme", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "pianosuite.example" })).toBe(
      "https://pianosuite.example",
    );
  });

  it("prefers VERCEL_PROJECT_PRODUCTION_URL over VERCEL_URL", () => {
    expect(
      resolveSiteUrl({
        VERCEL_PROJECT_PRODUCTION_URL: "prod.vercel.app",
        VERCEL_URL: "preview.vercel.app",
      }),
    ).toBe("https://prod.vercel.app");
  });

  it("uses VERCEL_URL alone", () => {
    expect(resolveSiteUrl({ VERCEL_URL: "preview.vercel.app" })).toBe(
      "https://preview.vercel.app",
    );
  });

  it("falls back to http://localhost:3000 on an empty env", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });

  it("strips a trailing slash", () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://pianosuite.example/" }),
    ).toBe("https://pianosuite.example");
  });

  it("treats an empty-string variable as unset", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: "",
        VERCEL_PROJECT_PRODUCTION_URL: "",
        VERCEL_URL: "   ",
      }),
    ).toBe("http://localhost:3000");
  });
});
