"use client";

import Link from "next/link";
import { FeatureSection } from "./feature-section";
import { FlowSection } from "./flow-section";
import { DeckSection } from "./deck-section";
import { CtaSection } from "./cta-section";
import { ToolsGridSection } from "./tools-grid-section";
import { WorkshopHowItWorks } from "./workshop-how-it-works";
import { StarterTemplatesSection } from "./starter-templates-section";

/**
 * Pure marketing content for the welcome page.
 *
 * Rendered by `WelcomePage` (production) and by the dev lab preview.
 * It intentionally does not include the Navbar, ambient host, or hero scrim
 * so the lab can frame it however it wants.
 */
export function WelcomeContent() {
  return (
    <>
      <WorkshopHowItWorks />
      <StarterTemplatesSection />
      <FeatureSection id="build-your-practice" />
      <FeatureSection id="start-from-something-that-works">
        <FlowSection />
      </FeatureSection>
      <FeatureSection id="why-these-drills-work" />
      <FeatureSection id="who-made-this" />

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-10">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                05
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                anki companion decks
              </span>
            </div>
            <h2 className="mb-4 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Ready-to-import Anki decks for chord drilling.
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                Two tab-separated Anki exports: root-position 7ths and diminished
                7ths across five keys (C-G-D-A-E), and the extended 9/11/13
                voicings with LH/RH fingering. Import via Anki&apos;s File → Import
                (Basic notetype) and they work with the Workshop&apos;s chord blocks
                out of the box — no add-on needed beyond AnkiConnect.
              </p>
            </div>
            <DeckSection />
          </div>
        </div>
      </section>

      <ToolsGridSection />

      <CtaSection />

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
