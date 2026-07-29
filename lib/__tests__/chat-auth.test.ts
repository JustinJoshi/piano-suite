import { describe, expect, it } from "vitest";
import { authorizeChatAccess } from "@/lib/chat-auth";

describe("authorizeChatAccess", () => {
  it("allows everyone when auth bypass is enabled", () => {
    expect(
      authorizeChatAccess({
        authDisabled: true,
        userId: null,
        allowedUserId: "user_allowed",
      })
    ).toBe("ok");
  });

  it("rejects unsigned callers when auth is enabled", () => {
    expect(
      authorizeChatAccess({
        authDisabled: false,
        userId: null,
        allowedUserId: "user_allowed",
      })
    ).toBe("unauthorized");
  });

  it("rejects signed-in users who are not on the allowlist", () => {
    expect(
      authorizeChatAccess({
        authDisabled: false,
        userId: "user_other",
        allowedUserId: "user_allowed",
      })
    ).toBe("forbidden");
  });

  it("rejects when the allowlist env is missing", () => {
    expect(
      authorizeChatAccess({
        authDisabled: false,
        userId: "user_anyone",
        allowedUserId: undefined,
      })
    ).toBe("forbidden");
  });

  it("allows the allowlisted user when auth is enabled", () => {
    expect(
      authorizeChatAccess({
        authDisabled: false,
        userId: "user_allowed",
        allowedUserId: "user_allowed",
      })
    ).toBe("ok");
  });
});
