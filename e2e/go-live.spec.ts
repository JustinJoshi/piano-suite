import { test, expect } from "@playwright/test";
import {
  expectNotBare404,
  expectNoApplicationError,
} from "./auth-assertions";

test.describe("go-live: legal pages", () => {
  const legalPages: Array<[string, RegExp]> = [
    ["/terms", /terms of service/i],
    ["/privacy", /privacy policy/i],
  ];

  for (const [path, heading] of legalPages) {
    test(`${path} renders for anonymous visitors`, async ({ page }) => {
      await page.goto(path);

      expect(page.url()).not.toMatch(/sign-in/);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expectNotBare404(page);
      await expectNoApplicationError(page);
    });
  }

  test("pricing page links to terms and privacy", async ({ page }) => {
    await page.goto("/pricing");

    await expectNotBare404(page);
    await expectNoApplicationError(page);

    await expect(
      page.getByRole("link", { name: /terms/i })
    ).toHaveCount(1);
    await expect(
      page.getByRole("link", { name: /privacy/i })
    ).toHaveCount(1);
  });
});

test.describe("go-live: waitlist replaces billing", () => {
  test("pricing page shows the founding pro waitlist pre-launch", async ({
    page,
  }) => {
    await page.goto("/pricing");

    await expectNotBare404(page);
    await expectNoApplicationError(page);

    await expect(screenFoundingHeadline(page)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /join/i })
    ).toBeVisible();
  });
});

function screenFoundingHeadline(page: import("@playwright/test").Page) {
  return page.getByText(/founding pro/i).first();
}
