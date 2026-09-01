import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";

/**
 * Renamed routes keep their old paths working via temporary redirects
 * (audit 2026-09, Phase 0.3): the community gallery moved from /workshop to
 * /marketplace, and the Workshop component picker from
 * /tools/workshop/marketplace to /tools/workshop/blocks.
 *
 * Middleware (proxy.ts) runs before next.config redirects, which is why the
 * legacy /workshop path stays in the public allowlist.
 */
test.describe("route renames redirect", () => {
  test("/workshop redirects to /marketplace for anonymous visitors", async ({
    page,
  }) => {
    await page.goto("/workshop");
    await expect(page).toHaveURL(/\/marketplace$/);
    await expect(
      page.getByRole("heading", { name: "Marketplace", exact: true })
    ).toBeVisible();
  });

  test("/workshop/<id> redirects to /marketplace/<id> without rendering", async ({
    request,
  }) => {
    const res = await request.get("/workshop/some-legacy-id", {
      maxRedirects: 0,
    });

    expect(res.status()).toBe(307);
    expect(res.headers()["location"]).toContain("/marketplace/some-legacy-id");
  });

  test("/tools/workshop/marketplace redirects to /tools/workshop/blocks when signed in", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/workshop/marketplace");
    await expect(page).toHaveURL(/\/tools\/workshop\/blocks$/);
  });
});
