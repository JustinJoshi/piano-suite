import { afterEach, describe, expect, it } from "vitest";
import { isAuthBypassEffective, isAuthDisabled } from "@/lib/auth-disabled";

describe("isAuthDisabled", () => {
  const original = process.env.NEXT_PUBLIC_AUTH_DISABLED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_AUTH_DISABLED;
    } else {
      process.env.NEXT_PUBLIC_AUTH_DISABLED = original;
    }
  });

  it("is false when the env var is unset (opt-in only; no default bypass)", () => {
    delete process.env.NEXT_PUBLIC_AUTH_DISABLED;
    expect(isAuthDisabled()).toBe(false);
  });

  it("is true only when set to the string 'true'", () => {
    process.env.NEXT_PUBLIC_AUTH_DISABLED = "true";
    expect(isAuthDisabled()).toBe(true);
  });

  it("treats other truthy-looking values as off", () => {
    process.env.NEXT_PUBLIC_AUTH_DISABLED = "1";
    expect(isAuthDisabled()).toBe(false);

    process.env.NEXT_PUBLIC_AUTH_DISABLED = "yes";
    expect(isAuthDisabled()).toBe(false);

    process.env.NEXT_PUBLIC_AUTH_DISABLED = "";
    expect(isAuthDisabled()).toBe(false);
  });

  it("is false when set to the string 'false'", () => {
    process.env.NEXT_PUBLIC_AUTH_DISABLED = "false";
    expect(isAuthDisabled()).toBe(false);
  });
});

describe("isAuthBypassEffective", () => {
  const originalAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED;
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    if (originalAuthDisabled === undefined) {
      delete process.env.NEXT_PUBLIC_AUTH_DISABLED;
    } else {
      process.env.NEXT_PUBLIC_AUTH_DISABLED = originalAuthDisabled;
    }
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
  });

  it("is never effective on Vercel Production, even with the flag set", () => {
    process.env.NEXT_PUBLIC_AUTH_DISABLED = "true";
    process.env.VERCEL_ENV = "production";
    expect(isAuthBypassEffective()).toBe(false);
  });

  it("is effective with the flag set on preview deployments", () => {
    process.env.NEXT_PUBLIC_AUTH_DISABLED = "true";
    process.env.VERCEL_ENV = "preview";
    expect(isAuthBypassEffective()).toBe(true);
  });

  it("is effective with the flag set when VERCEL_ENV is unset (local dev)", () => {
    process.env.NEXT_PUBLIC_AUTH_DISABLED = "true";
    delete process.env.VERCEL_ENV;
    expect(isAuthBypassEffective()).toBe(true);
  });

  it("is false when the bypass flag is off, regardless of environment", () => {
    delete process.env.NEXT_PUBLIC_AUTH_DISABLED;
    delete process.env.VERCEL_ENV;
    expect(isAuthBypassEffective()).toBe(false);

    process.env.VERCEL_ENV = "production";
    expect(isAuthBypassEffective()).toBe(false);
  });
});
