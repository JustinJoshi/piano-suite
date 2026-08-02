"use client";

import { Navbar } from "@/components/navbar";
import { useAmbientEffects } from "@/hooks/useAmbientEffects";
import { useHeroChladniSettings } from "@/hooks/useHeroChladniSettings";
import { useHeroQuasiperiodicSettings } from "@/hooks/useHeroQuasiperiodicSettings";
import { useHeroMultigridSettings } from "@/hooks/useHeroMultigridSettings";
import { HeroSection } from "./hero-section";
import { FeatureSection } from "./feature-section";
import { FlowSection } from "./flow-section";
import { DeckSection } from "./deck-section";
import { CtaSection } from "./cta-section";
import { ToolsGridSection } from "./tools-grid-section";

/**
 * Welcome / marketing page.
 *
 * Full-bleed atmosphere is owned by AmbientEffectsHost in the root layout.
 * This page only supplies content + the hero scrim pocket.
 */
export function WelcomePage() {
  const { settings: ambient, backgroundFor } = useAmbientEffects();
  const { settings: chladniSettings } = useHeroChladniSettings();
  const { settings: quasiperiodicSettings } = useHeroQuasiperiodicSettings();
  const { settings: multigridSettings } = useHeroMultigridSettings();

  const kind = backgroundFor("/");
  const heroScrimSettings =
    kind === "multigrid"
      ? multigridSettings
      : kind === "quasiperiodic"
        ? quasiperiodicSettings
        : kind === "chladni"
          ? chladniSettings
          : { scrimDarkness: ambient.scrimDarkness };

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection settings={heroScrimSettings} />

          <FeatureSection
            number="01"
            label="why it works"
            title="Re-reading a chord chart feels like practice. It isn't."
          >
            <p>
              Going over a chart again and again feels productive, but it barely
              moves the needle. What actually builds the memory is retrieval:
              forcing yourself to produce the answer instead of just recognizing
              it. And what makes it last is spacing those retrievals over days
              instead of cramming them into one sitting.
            </p>
            <p className="text-sm text-muted-foreground">
              Retrieval practice roughly doubled week-later retention over
              re-reading (Roediger &amp; Karpicke, 2006).
            </p>
            <p>
              That scheduling problem is exactly what Anki is for. It tracks,
              chord by chord, when you&apos;re about to forget something, and puts
              it back in front of you right before that happens. This drill
              doesn&apos;t reinvent any of that. It listens to whatever Anki
              already decided you need next.
            </p>
          </FeatureSection>

          <FeatureSection
            number="02"
            label="the actual point"
            title="Knowing a chord isn't the same as playing it"
          >
            <p>
              Flashcards are great at teaching you to name a chord. They can&apos;t
              teach your hands to find it, under time pressure, without looking.
              That&apos;s motor memory, and it needs a different kind of rep: hands
              off the keys, chord announced, play it, get timed.
            </p>
            <p>
              Anki keeps the recall side sharp. The drill keeps the physical side
              honest.
            </p>
          </FeatureSection>

          <FeatureSection
            number="03"
            label="how it actually works"
            title="One loop, two directions"
          >
            <p>
              Turn on <strong className="text-foreground">Anki Sync</strong> and the
              loop runs itself. No manual chord picking, no separate app to
              babysit.
            </p>
            <FlowSection />
          </FeatureSection>

          <FeatureSection
            number="04"
            label="not a new idea"
            title="This is how jazz pianists already practice"
          >
            <p>
              Drilling a voicing through every root, in time, until it stops
              requiring thought, is the standard route from theory to fluency in
              jazz piano, not a shortcut around it. This tool just puts a
              stopwatch and a spaced-repetition schedule underneath a practice
              habit that already exists.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Barry Harris — voicing drills",
                "Mark Levine — Drop 2 / block chords",
                "woodshedding in all 12 keys",
              ].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </FeatureSection>

          <FeatureSection
            number="05"
            label="the companion deck"
            title="The actual Anki deck behind this"
          >
            <p>
              Two ready-to-import decks: root-position 7ths and diminished 7ths
              across five keys (C-G-D-A-E), and the extended 9/11/13 voicings with
              LH/RH fingering built in. Both are plain tab-separated Anki exports.
              Import them via Anki&apos;s File → Import (Basic notetype) and they work
              with this drill out of the box, no add-on needed beyond AnkiConnect.
            </p>
            <DeckSection />
          </FeatureSection>

          <FeatureSection
            number="06"
            label="who made this"
            title="Why this exists"
          >
            <p>
              Lessons run $60 an hour and up, so a lot of us teach ourselves.
              This suite is the toolkit I wanted for that path: drills, timers,
              and pattern labs built to live inside a self-taught routine, with
              Anki as the other half of it. Take whatever&apos;s useful.
              Everything that runs locally on your machine stays free.
            </p>
            <p>
              The project is{" "}
              <a
                href="https://github.com/JustinJoshi/piano-suite"
                className="text-primary underline-offset-2 hover:underline"
              >
                open source
              </a>
              . If you&apos;re teaching yourself too, questions and ideas are
              always welcome.
            </p>
          </FeatureSection>

          <ToolsGridSection />

          <CtaSection />
        </main>

        <footer className="border-t border-border/50 bg-card/80 py-8 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            Piano Suite — a practice toolkit for self-taught pianists. Built
            for Anki, spaced repetition, and real keys.
          </div>
        </footer>
    </div>
  );
}
