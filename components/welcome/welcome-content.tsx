"use client";

import Link from "next/link";
import { DoorChooser } from "./door-chooser";
import { FeatureSection } from "./feature-section";
import { WorkshopHowItWorks } from "./workshop-how-it-works";
import { StarterTemplatesSection } from "./starter-templates-section";

/**
 * Pure marketing content for the welcome page.
 *
 * Phase 1.4 order: three doors → one "how it works" → starter templates →
 * one evidence section → the story → footer. Roughly half the old page:
 * the 12-card tool grid, the duplicate CTA, the second feature essay, and
 * the Anki decks section (now folded into the Play door / guided routes)
 * are gone.
 *
 * Rendered by `WelcomePage` (production) and by the dev lab preview.
 * It intentionally does not include the Navbar, ambient host, or hero scrim
 * so the lab can frame it however it wants.
 */
export function WelcomeContent() {
  return (
    <>
      <DoorChooser />
      <WorkshopHowItWorks />
      <StarterTemplatesSection />
      <FeatureSection id="why-these-drills-work" />
      <FeatureSection id="who-made-this" />

      <footer className="border-t border-border/50 bg-card/80 py-8 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          Piano Suite — a free practice community for self-taught pianists.
          <div className="mt-2 space-x-4">
            <Link
              href="/terms"
              className="underline-offset-2 hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="underline-offset-2 hover:underline"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
