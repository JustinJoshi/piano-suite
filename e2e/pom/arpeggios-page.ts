import { Page, expect } from "@playwright/test";
import { BasePage } from "./base-page";

/**
 * Page object for the Arpeggios tool.
 */
export class ArpeggiosPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await super.goto("/tools/arpeggios");
    await this.waitForLoaded("arpeggios-drill", { timeout: 10000 });
  }

  async expectLoaded() {
    await this.expectHeading(/Arpeggios/);
    await expect(this.locator("arpeggios-drill")).toBeVisible();
  }

  async expectChordName(name: string) {
    await expect(this.locator("arpeggio-chord-name")).toHaveText(name);
  }

  async expectLhNotesVisible() {
    await expect(this.locator("arpeggio-lh-notes")).toHaveClass(/opacity-100/);
  }

  async expectLhNotesHidden() {
    await expect(this.locator("arpeggio-lh-notes")).toHaveClass(/opacity-0/);
  }

  async toggleLhNotes(show: boolean) {
    await this.toggleSetting("setting-row-show-lh-notes", show);
  }

  async toggleFlashOnMiss(on: boolean) {
    await this.toggleSetting("setting-row-flash-on-miss", on);
  }

  async toggleLapChime(on: boolean) {
    await this.toggleSetting("setting-row-lap-chime", on);
  }

  async toggleAutoFilter(on: boolean) {
    await this.toggleSetting("setting-row-auto-filter", on);
  }

  async openCustomizeSequence() {
    await this.locator("customize-sequence-btn").click();
  }

  async resetSequenceOrder() {
    await this.page.getByRole("button", { name: "Reset to default order" }).click();
  }

  async nextChord() {
    await this.locator("next-chord-btn").click();
  }

  async expectMissFilterPc(pc: number, pressed: boolean) {
    await expect(this.locator(`miss-filter-pc-${pc}`)).toHaveAttribute(
      "aria-pressed",
      String(pressed)
    );
  }

  async toggleMissFilterPc(pc: number) {
    await this.locator(`miss-filter-pc-${pc}`).click();
  }

  async useChordMissFilter() {
    await this.locator("miss-filter-use-chord").click();
  }

  async clearMissFilter() {
    await this.locator("miss-filter-clear").click();
  }

  async expectTargetNoteVisible() {
    await expect(this.locator("arpeggio-target-note")).toBeVisible();
  }

  async expectCellStripCount(count: number) {
    await expect(this.locator("arpeggio-cell-strip").locator("span")).toHaveCount(count);
  }

  private async toggleSetting(rowTestId: string, on: boolean) {
    const row = this.locator(rowTestId);
    const label = on ? "On" : "Off";
    await row.locator("button", { hasText: label }).click();
  }
}
