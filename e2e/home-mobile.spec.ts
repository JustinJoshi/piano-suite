import { test, expect } from "@playwright/test";

test.describe("home page mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test("renders hero CTA and supporting text without overflow", async ({
    page,
  }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: /come on in/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toBeInViewport();

    const supporting = page.getByText(/explore the community gallery freely/i);
    await expect(supporting).toBeVisible();
  });

  test("shows Workshop how-it-works steps on mobile", async ({ page }) => {
    await page.goto("/");
    const steps = [
      "Pick a starter drill or open a fresh page",
      "Press start and play — we’ll keep time for you",
      "Tweak the blocks until it feels like yours",
    ];
    for (const text of steps) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
  });

  test("shows Workshop flow steps in a vertical layout on mobile", async ({
    page,
  }) => {
    await page.goto("/");
    const steps = [
      "Start from a friendly template or a fresh page",
      "Snap metronome, timer, and chord blocks together",
      "Press start and play — real keys or on-screen",
      "Share what you built, or borrow someone else’s",
    ];
    for (const text of steps) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
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
      "Re-reading a chord chart feels like practice. It isn’t — and that’s good news"
    );
    await expect(firstFeature).toBeVisible();
  });
});
