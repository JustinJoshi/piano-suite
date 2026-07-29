import { afterEach, describe, expect, it } from "vitest";
import {
  getAuthorizedPartiesFromEnv,
  parseAuthorizedParties,
} from "@/lib/clerk-authorized-parties";

describe("parseAuthorizedParties", () => {
  it("returns undefined when unset or blank", () => {
    expect(parseAuthorizedParties(undefined)).toBeUndefined();
    expect(parseAuthorizedParties("")).toBeUndefined();
    expect(parseAuthorizedParties("   ")).toBeUndefined();
  });

  it("parses a single origin", () => {
    expect(parseAuthorizedParties("https://example.com")).toEqual([
      "https://example.com",
    ]);
  });

  it("parses comma-separated origins and trims whitespace", () => {
    expect(
      parseAuthorizedParties(
        "https://example.com, https://www.example.com ,http://localhost:3000"
      )
    ).toEqual([
      "https://example.com",
      "https://www.example.com",
      "http://localhost:3000",
    ]);
  });

  it("ignores empty segments from trailing commas", () => {
    expect(parseAuthorizedParties("https://example.com,,")).toEqual([
      "https://example.com",
    ]);
  });
});

describe("getAuthorizedPartiesFromEnv", () => {
  const original = process.env.CLERK_AUTHORIZED_PARTIES;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.CLERK_AUTHORIZED_PARTIES;
    } else {
      process.env.CLERK_AUTHORIZED_PARTIES = original;
    }
  });

  it("reads CLERK_AUTHORIZED_PARTIES from process.env by default", () => {
    process.env.CLERK_AUTHORIZED_PARTIES = "https://piano.example";
    expect(getAuthorizedPartiesFromEnv()).toEqual(["https://piano.example"]);
  });

  it("accepts an explicit env object", () => {
    expect(
      getAuthorizedPartiesFromEnv({
        CLERK_AUTHORIZED_PARTIES: "https://a.test,https://b.test",
      })
    ).toEqual(["https://a.test", "https://b.test"]);
  });
});
