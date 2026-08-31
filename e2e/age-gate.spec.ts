import { test, expect } from "@playwright/test";

// Exercises the real COPPA age gate with no stored decision. Every other spec
// inherits "eligible" either from global setup's saved storage state or from
// e2e/age-gate.ts, so only this spec sees the gate.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("age gate", () => {
  test("asks for age before showing the app", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByLabel(/birthday/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /piano practice/i })
    ).toBeHidden();
  });

  test("unlocks after an adult birthday and remembers on reload", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByLabel(/birthday/i).fill("2000-01-01");
    await page.getByRole("button", { name: /continue/i }).click();

    await expect(
      page.getByRole("heading", { name: /piano practice/i })
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("heading", { name: /piano practice/i })
    ).toBeVisible();
  });

  test("blocks under-13 visits without showing the app", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel(/birthday/i).fill("2020-01-01");
    await page.getByRole("button", { name: /continue/i }).click();

    await expect(page.getByText(/13 or older/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /piano practice/i })
    ).toBeHidden();

    await page.reload();
    await expect(page.getByText(/13 or older/i)).toBeVisible();
  });
});
