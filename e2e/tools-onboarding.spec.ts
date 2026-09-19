import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

const ONBOARDING_RESET_URL = "/tools/workshop?onboarding=reset";

// signInAsTestUser marks onboarding completed (the shared helper cannot
// know which spec wants a first visit), so these tests clear the flag.
// The one-shot variant only clears the first load, so a Dismiss in the
// middle of a test can persist across later navigations.
function forgetOnboardingOnce(page: import("@playwright/test").Page) {
  return page.addInitScript((key) => {
    const w = window as unknown as { __e2eOnboardingCleared?: boolean };
    if (!w.__e2eOnboardingCleared) {
      localStorage.removeItem(key);
      w.__e2eOnboardingCleared = true;
    }
  }, ONBOARDING_STORAGE_KEY);
}

async function openTour(page: import("@playwright/test").Page) {
  await page
    .getByTestId("onboarding-strip")
    .getByRole("button", { name: /take the tour/i })
    .click();
  return page.getByTestId("onboarding-shell");
}

test.describe("/tools onboarding", () => {
  test("first visit shows the in-flow strip, not the overlay", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    forgetOnboardingOnce(page);
    await page.goto("/tools/workshop");

    await expect(page.getByTestId("onboarding-strip")).toBeVisible();
    await expect(page.getByTestId("onboarding-shell")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Workshop" })).toBeVisible();
  });

  test("take the tour opens the six-slide overlay from the strip", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    forgetOnboardingOnce(page);
    await page.goto("/tools/workshop");

    const shell = await openTour(page);
    await expect(shell.getByText("Hi", { exact: true })).toBeVisible();
    await expect(shell.getByText("welcome to piano suite")).toBeVisible();

    // All six slides stay reachable, ending on the closing slide.
    for (const slide of [
      /three most important pillars/i,
      "Active recall & spaced repetition",
      "Take care of yourself",
      "Manage your frustrations",
      "Happy playing — we're rooting for you",
    ]) {
      await shell.getByRole("button", { name: /next/i }).first().click();
      await expect(shell.getByText(slide).first()).toBeVisible();
    }
    await shell.getByRole("button", { name: /let's practice/i }).click();
    await expect(page.getByTestId("onboarding-shell")).toHaveCount(0);
  });

  test("dismissing the strip keeps the dashboard usable and persists", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    forgetOnboardingOnce(page);
    await page.goto("/tools/workshop");

    await page
      .getByTestId("onboarding-strip")
      .getByRole("button", { name: /dismiss/i })
      .click();
    await expect(page.getByTestId("onboarding-strip")).toHaveCount(0);
    await expect(page.getByTestId("onboarding-shell")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Workshop" })).toBeVisible();

    // Dismissal persists: a plain revisit shows neither strip nor overlay.
    await page.goto("/tools/workshop");
    await expect(page.getByTestId("onboarding-strip")).toHaveCount(0);
  });

  test("?onboarding=reset clears completion so the strip returns", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/workshop");

    // A completed first visit: no strip, no overlay.
    await expect(page.getByTestId("onboarding-strip")).toHaveCount(0);

    // The reset parameter clears completion: the strip is back (in flow,
    // not the overlay) and the tour can be taken again.
    await page.goto(ONBOARDING_RESET_URL);
    await expect(page.getByTestId("onboarding-strip")).toBeVisible();
    await expect(page.getByTestId("onboarding-shell")).toHaveCount(0);

    const shell = await openTour(page);
    await expect(shell.getByText("Hi", { exact: true })).toBeVisible();
  });

  test("goes back to the previous slide", async ({ page }) => {
    await signInAsTestUser(page);
    forgetOnboardingOnce(page);
    await page.goto("/tools/workshop");

    const shell = await openTour(page);

    await shell.getByRole("button", { name: /next/i }).first().click();
    await expect(
      shell.getByText(/three most important pillars/i)
    ).toBeVisible();

    await shell.getByRole("button", { name: /back/i }).first().click();
    await expect(shell.getByText("Hi", { exact: true })).toBeVisible();
    await expect(shell.getByText("welcome to piano suite")).toBeVisible();
  });

  test("fits within a mobile viewport and advances through pillars", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await signInAsTestUser(page);
    forgetOnboardingOnce(page);
    await page.goto("/tools/workshop");

    const shell = await openTour(page);

    await expect(shell.getByText("Hi", { exact: true })).toBeVisible();
    await shell.getByRole("button", { name: /next/i }).first().click();

    await expect(
      shell.getByText(/three most important pillars/i)
    ).toBeVisible();
    await shell.getByRole("button", { name: /next/i }).first().click();

    await expect(
      shell.getByText("Active recall & spaced repetition")
    ).toBeVisible();

    // Resource cards should be reachable without horizontal overflow.
    const ankiLink = shell.getByRole("link", { name: /Anki/i }).first();
    await expect(ankiLink).toBeVisible();
    await expect(ankiLink).toBeInViewport();
  });
});
