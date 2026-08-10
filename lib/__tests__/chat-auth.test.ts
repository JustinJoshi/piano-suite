import { describe, expect, it } from "vitest";
import { authorizeChatAccess } from "@/lib/chat-auth";

describe("authorizeChatAccess", () => {
  it("rejects unsigned callers", () => {
    expect(
      authorizeChatAccess({
        userId: null,
        allowedUserId: "user_allowed",
      })
    ).toBe("unauthorized");
  });

  it("rejects signed-in users who are not on the allowlist", () => {
    expect(
      authorizeChatAccess({
        userId: "user_other",
        allowedUserId: "user_allowed",
      })
    ).toBe("forbidden");
  });

  it("rejects when the allowlist env is missing", () => {
    expect(
      authorizeChatAccess({
        userId: "user_anyone",
        allowedUserId: undefined,
      })
    ).toBe("forbidden");
  });

  it("allows the allowlisted user", () => {
    expect(
      authorizeChatAccess({
        userId: "user_allowed",
        allowedUserId: "user_allowed",
      })
    ).toBe("ok");
  });
});
