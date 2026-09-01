import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

/**
 * Phase 1.7: the six-slide learning-science deck no longer gates the
 * Workshop. It lives at /learn/practice-pillars (inline, always reachable)
 * and the pillars are also a plain article.
 */
test.describe("onboarding is out of the way", () => {
  test("first visit shows the editor, not a fullscreen deck", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    // Simulate a true first session: the completed flag is not set.
    await page.evaluate(
      (key) => localStorage.removeItem(key),
      ONBOARDING_STORAGE_KEY
    );
    await page.goto("/tools/workshop");

    await expect(page.getByTestId("onboarding-shell")).toHaveCount(0);
    // A fresh store greets with the starter picker (the grid renders once
    // dismissed); either way the editor is in front, not the deck.
    await expect(
      page.getByRole("heading", { name: "Workshop" })
    ).toBeVisible();
    await expect(
      page
        .getByText("How do you want to start?")
        .or(page.getByTestId("workshop-grid"))
        .first()
    ).toBeVisible();
  });

  test("the ?onboarding=reset param no longer mounts the deck on /tools", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools?onboarding=reset");

    await expect(page).toHaveURL(/\/tools\/workshop/);
    await expect(page.getByTestId("onboarding-shell")).toHaveCount(0);
  });

  test("the pillars live at /learn/practice-pillars", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/learn/practice-pillars");

    // Inline deck shell with the intro slide.
    await expect(page.getByTestId("onboarding-shell")).toBeVisible();
    await expect(page.getByText("welcome to piano suite")).toBeVisible();
  });

  test("reachable from the settings page", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/settings");

    await page
      .getByRole("link", { name: /replay the practice pillars/i })
      .click();
    await expect(page).toHaveURL(/\/learn\/practice-pillars$/);
    await expect(page.getByTestId("onboarding-shell")).toBeVisible();
  });
});
