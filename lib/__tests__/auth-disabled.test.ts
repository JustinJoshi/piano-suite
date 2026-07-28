import { afterEach, describe, expect, it } from "vitest";
import { isAuthDisabled } from "@/lib/auth-disabled";

describe("isAuthDisabled", () => {
  const original = process.env.NEXT_PUBLIC_AUTH_DISABLED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_AUTH_DISABLED;
    } else {
      process.env.NEXT_PUBLIC_AUTH_DISABLED = original;
    }
  });

  it("is false when the env var is unset", () => {
    delete process.env.NEXT_PUBLIC_AUTH_DISABLED;
    expect(isAuthDisabled()).toBe(false);
  });

  it("is true only when set to the string 'true'", () => {
    process.env.NEXT_PUBLIC_AUTH_DISABLED = "true";
    expect(isAuthDisabled()).toBe(true);

    process.env.NEXT_PUBLIC_AUTH_DISABLED = "1";
    expect(isAuthDisabled()).toBe(false);

    process.env.NEXT_PUBLIC_AUTH_DISABLED = "false";
    expect(isAuthDisabled()).toBe(false);
  });
});
