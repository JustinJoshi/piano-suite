import { test, expect } from "@playwright/test";

test.describe("home page mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test("renders hero CTA and supporting text without overflow", async ({
    page,
  }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /start learning/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toBeInViewport();

    const supporting = page.getByText(/No account needed to explore/i);
    await expect(supporting).toBeVisible();
  });

  test("shows Anki flow steps in a vertical layout on mobile", async ({
    page,
  }) => {
    await page.goto("/");
    const steps = [
      "Your due card names a chord",
      "The drill loads that chord",
      "You play it, timed, on real keys",
      "The card flips so you can grade it",
    ];
    for (const text of steps) {
      await expect(page.getByText(text)).toBeVisible();
    }
  });

  test("deck download buttons stack without overflowing", async ({ page }) => {
    await page.goto("/");
    const buttons = page.getByRole("link", { name: /chord symbols/i });
    const count = await buttons.count();
    expect(count).toBe(2);
    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toBeVisible();
    }
  });

  test("feature cards are readable on mobile", async ({ page }) => {
    await page.goto("/");
    const firstFeature = page.getByText(
      "Re-reading a chord chart feels like practice. It isn't."
    );
    await expect(firstFeature).toBeVisible();
  });
});
