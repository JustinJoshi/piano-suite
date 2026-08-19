import { Page, expect } from "@playwright/test";
import { BasePage } from "./base-page";

export type ChordDrillMode = "single" | "family" | "extended";

/**
 * Page object for the Chord Drill tool.
 */
export class ChordDrillPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto("/tools/chord-drill");
    await this.waitForLoaded("chord-drill", { timeout: 20000 });
  }

  async expectLoaded() {
    await this.expectHeading(/Chord Drill/);
    await expect(this.locator("chord-drill")).toBeVisible();
  }

  async selectMode(mode: ChordDrillMode) {
    await this.locator(`chord-drill-mode-${mode}`).click();
  }

  async selectRoot(pc: number) {
    await this.locator(`chord-drill-root-${pc}`).click();
  }

  async selectQuality(suffix: string) {
    // Suffixes like "m7", "maj7", "7", "m7b5" are sanitized to alphanumeric.
    const sanitized = suffix.replace(/[^a-zA-Z0-9]/g, "");
    await this.locator(`chord-drill-quality-${sanitized}`).click();
  }

  async getSymbol() {
    return this.locator("chord-symbol").textContent();
  }

  async expectSymbol(text: string | RegExp) {
    await expect(this.locator("chord-symbol")).toHaveText(text);
  }

  async expectNotesVisible() {
    await expect(this.locator("chord-notes")).not.toHaveClass(/opacity-0/);
  }

  async expectNotesHidden() {
    await expect(this.locator("chord-notes")).toHaveClass(/opacity-0/);
  }

  async toggleChordNotes(show: boolean) {
    await this.toggleSetting("setting-row-chord-notes", show);
  }

  async toggleRevealOnFinish(on: boolean) {
    await this.toggleSetting("setting-row-reveal-on-finish", on);
  }

  async toggleRequireExactNotes(on: boolean) {
    await this.toggleSetting("setting-row-require-exact-notes", on);
  }

  async toggleCelebrateGood(on: boolean) {
    await this.toggleSetting("setting-row-celebrate-good", on);
  }

  async toggleAutoTimer(on: boolean) {
    await this.toggleSetting("setting-row-automatic-timer", on);
  }

  async toggleHideUntilGo(on: boolean) {
    await this.toggleSetting("setting-row-hide-until-go", on);
  }

  async toggleStartCountdown(on: boolean) {
    await this.toggleSetting("setting-row-start-countdown", on);
  }

  async toggleAutoGrade(on: boolean) {
    await this.toggleSetting("setting-row-auto-grade", on);
  }

  async setRepTarget(n: number) {
    await this.locator(`chord-drill-rep-target-${n}`).click();
  }

  async setCustomRepTarget(n: number) {
    const input = this.locator("rep-custom-input");
    await input.fill(String(n));
    await input.blur();
    await expect(input).toHaveValue(String(n));
  }

  async shuffle() {
    await this.locator("shuffle-btn").click();
  }

  async openPerChordReps() {
    const row = this.locator("setting-row-per-chord-reps");
    await row.locator("button", { hasText: "On" }).click();
    await this.locator("manage-per-chord-reps-btn").click();
    await expect(this.locator("per-chord-reps-modal")).toBeVisible();
  }

  async savePerChordReps() {
    await this.page.getByRole("button", { name: "Save" }).click();
    await expect(this.locator("per-chord-reps-modal")).toBeHidden();
  }

  private async toggleSetting(rowTestId: string, on: boolean) {
    const row = this.locator(rowTestId);
    const label = on ? "On" : "Off";
    await row.locator("button", { hasText: label }).click();
  }
}
