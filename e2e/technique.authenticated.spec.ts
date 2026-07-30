import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";

const today = new Date().toISOString().slice(0, 10);

const legacyTechniqueLog = {
  [today]: { bpm: 72, notes: "felt smooth", exercise: "Hanon 1" },
};

test.describe("/tools/technique authenticated", () => {
  test("signed-in user sees the technique tracker", async ({ page }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/technique");

    await expect(page.getByRole("heading", { name: "Technique" })).toBeVisible();
    await expect(page.getByTestId("exercise-input")).toBeVisible();
    await expect(page.getByTestId("bpm-slider")).toBeVisible();
    await expect(page.getByTestId("metronome-btn")).toBeVisible();
  });

  test("signed-in Free user sees local practice banner (no Pro upload UI)", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/technique");

    await expect(page.locator("body")).toContainText("Local practice mode");
    await expect(page.getByRole("link", { name: "See plans" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      "Upload technique history to Pro"
    );
  });

  test("signed-in user can log a technique session and see the streak update", async ({
    page,
  }) => {
    await signInAsTestUser(page);
    await page.goto("/tools/technique");

    await page.getByTestId("exercise-input").fill("Czerny 5-Finger Pattern");
    await page.getByTestId("bpm-slider").fill("80");
    await page.getByTestId("notes-input").fill("left hand even today");

    await page.getByTestId("mark-done-btn").click();

    await expect(page.getByTestId("mark-done-btn")).toContainText(
      "Logged today at 80 BPM — tap to update"
    );

    await expect(page.getByTestId("streak-number")).toContainText("1");
    await expect(page.getByTestId("grid-cell-today")).toBeVisible();
  });

  test("signed-in Free user reads legacy technique localStorage data", async ({
    page,
  }) => {
    await signInAsTestUser(page);

    await page.evaluate((data) => {
      localStorage.setItem("technique-habit-log-v1", JSON.stringify(data));
    }, legacyTechniqueLog);

    await page.goto("/tools/technique");

    // Free tier reads browser history directly — no Convex import step.
    await expect(page.locator("body")).toContainText("Local practice mode");
    await expect(page.locator("body")).not.toContainText(
      "Upload technique history to Pro"
    );
    await expect(page.getByTestId("streak-number")).toContainText("1");

    await page.evaluate(() => {
      localStorage.removeItem("technique-habit-log-v1");
    });
  });
});
