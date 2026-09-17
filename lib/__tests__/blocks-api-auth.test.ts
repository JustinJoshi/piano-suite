import { describe, expect, it } from "vitest";
import { authorizeBlocksApiAccess } from "@/lib/blocks-api-auth";

describe("authorizeBlocksApiAccess", () => {
  it("allows anonymous callers", () => {
    expect(authorizeBlocksApiAccess({ userId: null })).toBe("ok");
  });

  it("allows signed-in callers", () => {
    expect(authorizeBlocksApiAccess({ userId: "user_anyone" })).toBe("ok");
  });

  it("decides identically regardless of caller identity", () => {
    // The catalogue is public and carries no user data, so the decision
    // must not vary by who is asking.
    const anonymous = authorizeBlocksApiAccess({ userId: undefined });
    const signedIn = authorizeBlocksApiAccess({ userId: "user_someone" });
    expect(anonymous).toBe(signedIn);
  });
});
