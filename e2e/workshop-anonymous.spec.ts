import { test, expect } from "@playwright/test";
import {
  expectNoApplicationError,
  expectNotBare404,
  expectRedirectedToSignIn,
} from "./auth-assertions";

/**
 * Change A (public workshop): an unsigned visitor reaches the starter
 * picker, builds a page, and returns from the marketplace — no Clerk
 * redirect, no onboarding overlay, no "Sign in to create…" card.
 *
 * storageState is empty per test (fresh context, fresh localStorage), so
 * this exercises the true anonymous first run. It must NOT write
 * `piano-suite:onboarding-completed`: the product fix is that the overlay
 * does not mount for unsigned visitors at all.
 */
test.describe("/tools/workshop anonymous", () => {
  test.use({
    storageState: { cookies: [] as never[], origins: [] as never[] },
  });

  test("unsigned visitor reaches the starter picker, no overlay", async ({
    page,
  }) => {
    await page.goto("/tools/workshop");

    await expect(page).toHaveURL(/\/tools\/workshop$/);
    await expectNotBare404(page);
    await expectNoApplicationError(page);

    await expect(
      page.getByRole("heading", { name: "Workshop" })
    ).toBeVisible();
    await expect(page.getByTestId("onboarding-shell")).toHaveCount(0);
    await expect(
      page.getByText("Sign in to create custom practice pages.")
    ).toHaveCount(0);

    // First run greets with ready-made templates (starter picker).
    await expect(page.getByText("How do you want to start?")).toBeVisible();
  });

  test("hero CTA on / enters the workshop without an account", async ({
    page,
  }) => {
    await page.goto("/");
    await expectNoApplicationError(page);

    await page
      .getByRole("link", { name: /enter the workshop/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/tools\/workshop$/);
    await expect(page.getByTestId("onboarding-shell")).toHaveCount(0);
    await expect(page.getByText("How do you want to start?")).toBeVisible();
  });

  test("anonymous marketplace round-trip adds a metronome block", async ({
    page,
  }) => {
    await page.goto("/tools/workshop");

    await expect(page.getByText("How do you want to start?")).toBeVisible();
    await page.getByRole("button", { name: /start from scratch/i }).click();

    // First-run grid keeps the ready-made drill shortcuts tile.
    await expect(page.getByText(/in a hurry\?/i)).toBeVisible();

    await page.getByRole("link", { name: /open the marketplace/i }).click();
    await expect(page).toHaveURL(/\/tools\/workshop\/marketplace$/);
    await expect(
      page.getByRole("heading", { name: "Marketplace" })
    ).toBeVisible();

    await page.getByRole("button", { name: /add metronome/i }).click();
    await expect(
      page.getByRole("button", { name: /metronome added/i })
    ).toBeVisible();

    await page.getByRole("link", { name: /back to workshop/i }).click();
    await expect(page).toHaveURL(/\/tools\/workshop$/);
    await expect(page.getByTestId("bpm-display")).toHaveText("120 BPM");

    // The block persists via localStorage for the anonymous session.
    await page.reload();
    await expect(page.getByTestId("bpm-display")).toHaveText("120 BPM");
  });

  // next.config.ts 307s /tools → /tools/workshop BEFORE the proxy runs, and
  // the workshop is public — so unsigned /tools lands on the editor.
  test("/tools lands unsigned visitors on the public workshop", async ({
    page,
  }) => {
    await page.goto("/tools");
    await expect(page).toHaveURL(/\/tools\/workshop$/);
    await expectNoApplicationError(page);
    await expect(
      page.getByRole("heading", { name: "Workshop" })
    ).toBeVisible();
  });

  test("/tools/chord-drill still redirects unsigned visitors", async ({
    page,
  }) => {
    await page.goto("/tools/chord-drill");
    await expectRedirectedToSignIn(page);
  });
});
