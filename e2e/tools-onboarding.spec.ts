import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";

const ONBOARDING_RESET_URL = "/tools?onboarding=reset";

test.describe("/tools onboarding", () => {
  test("shows the onboarding flow on first visit", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto(ONBOARDING_RESET_URL);

    const shell = page.getByTestId("onboarding-shell");
    await expect(shell.getByText("Hi", { exact: true })).toBeVisible();
    await expect(shell.getByText("welcome to piano suite")).toBeVisible();
  });

  test("advances through all slides and releases the dashboard", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto(ONBOARDING_RESET_URL);

    const shell = page.getByTestId("onboarding-shell");

    await shell.getByRole("button", { name: /next/i }).first().click();
    await expect(
      shell.getByText(/three most important pillars/i)
    ).toBeVisible();

    await shell.getByRole("button", { name: /next/i }).first().click();
    await expect(
      shell.getByText("Active recall & spaced repetition")
    ).toBeVisible();
    await expect(shell.getByRole("link", { name: /Anki/i }).first()).toBeVisible();

    await shell.getByRole("button", { name: /next/i }).first().click();
    await expect(shell.getByText("Take care of yourself")).toBeVisible();

    await shell.getByRole("button", { name: /next/i }).first().click();
    await expect(shell.getByText("Manage your frustrations")).toBeVisible();

    await shell.getByRole("button", { name: /next/i }).first().click();
    await expect(shell.getByText("Happy learning")).toBeVisible();

    await shell.getByRole("button", { name: /let's practice/i }).click();
    await expect(page.getByRole("heading", { name: "Practice dashboard" })).toBeVisible();
  });

  test("skipping the flow releases the dashboard and persists completion", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto(ONBOARDING_RESET_URL);

    const shell = page.getByTestId("onboarding-shell");
    await shell.getByRole("button", { name: /skip/i }).click();
    await expect(page.getByRole("heading", { name: "Practice dashboard" })).toBeVisible();

    // Revisit without reset: onboarding should not appear.
    await page.goto("/tools");
    await expect(page.getByTestId("onboarding-shell")).not.toBeVisible();
  });

  test("does not show onboarding after it has been completed", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto(ONBOARDING_RESET_URL);

    const shell = page.getByTestId("onboarding-shell");

    // Advance through all slides and complete the flow.
    for (let i = 0; i < 5; i++) {
      await shell.getByRole("button", { name: /next/i }).first().click();
    }
    await shell.getByRole("button", { name: /let's practice/i }).click();

    await page.goto("/tools");
    await expect(page.getByTestId("onboarding-shell")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Practice dashboard" })).toBeVisible();
  });

  test("shows onboarding when deep-linking to a tool for the first time", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/chord-drill?onboarding=reset");

    const shell = page.getByTestId("onboarding-shell");
    await expect(shell.getByText("Hi", { exact: true })).toBeVisible();
    await expect(shell.getByText("welcome to piano suite")).toBeVisible();

    await shell.getByRole("button", { name: /skip/i }).click();

    // After skipping, the underlying tool page should be visible.
    await expect(page.getByRole("heading", { name: "Chord Drill" })).toBeVisible();

    // Revisiting the same tool should not show onboarding again.
    await page.goto("/tools/chord-drill");
    await expect(page.getByTestId("onboarding-shell")).not.toBeVisible();
  });

  test("goes back to the previous slide", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto(ONBOARDING_RESET_URL);

    const shell = page.getByTestId("onboarding-shell");

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
    await page.goto(ONBOARDING_RESET_URL);

    const shell = page.getByTestId("onboarding-shell");

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
