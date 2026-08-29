import { test, expect } from "@playwright/test";
import { assertAuthBypassOffForE2E } from "./auth-assertions";

test.describe("chat API auth gate", () => {
  test.describe.configure({ mode: "serial" });

  // The chromium project injects a signed-in storage state; this spec's
  // premise is a request with NO session, so opt out explicitly.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeAll(() => {
    assertAuthBypassOffForE2E();
  });

  test("POST /api/chat without a session returns 401", async ({ request }) => {
    const res = await request.post("/api/chat", {
      data: {
        messages: [{ role: "user", content: "hello" }],
      },
    });

    expect(res.status()).toBe(401);
    expect(await res.text()).toBe("Unauthorized");
  });
});