"use client";

import { Navbar } from "@/components/navbar";
import { useAmbientEffects } from "@/hooks/useAmbientEffects";
import { useHeroChladniSettings } from "@/hooks/useHeroChladniSettings";
import { useHeroQuasiperiodicSettings } from "@/hooks/useHeroQuasiperiodicSettings";
import { HeroSection } from "./hero-section";
import { FeatureSection } from "./feature-section";
import { FlowSection } from "./flow-section";
import { DeckSection } from "./deck-section";
import { CtaSection } from "./cta-section";

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
    kind === "quasiperiodic"
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
            label="the memory science"
            title="Why active recall and spacing work"
          >
            <p>
              Reading a chord chart again and again feels productive, but it barely
              moves the needle. <strong className="text-foreground">Retrieving</strong>{" "}
              an answer from memory — forcing yourself to produce it, not just
              recognize it — is what actually strengthens the memory. Spacing those
              retrievals out over days, instead of cramming them into one sitting, is
              what makes the memory last.
            </p>
            <p className="text-sm text-muted-foreground">
              ↳ retrieval practice roughly doubled week-later retention over
              re-reading (Roediger &amp; Karpicke, 2006)
            </p>
          </FeatureSection>

          <FeatureSection
            number="02"
            label="the scheduler"
            title="Why Anki is doing the driving"
          >
            <p>
              Anki&apos;s job is to know, chord by chord, exactly when you&apos;re about to
              forget it — and put it back in front of you right before that happens.
              Its modern engine,{" "}
              <strong className="text-foreground">FSRS</strong>, builds a model of
              your personal memory from your review history, so the schedule adapts
              to you instead of a fixed formula. This drill doesn&apos;t reinvent that —
              it just listens to whatever Anki already decided you need next.
            </p>
          </FeatureSection>

          <FeatureSection
            number="03"
            label="the actual point"
            title="Knowing a chord isn't the same as playing it"
          >
            <p>
              Flashcards are excellent at teaching you to{" "}
              <strong className="text-foreground">name</strong> a chord. They&apos;re not
              built to teach your hands to <strong className="text-foreground">find</strong>{" "}
              it, under time pressure, without looking. That&apos;s a different kind of
              memory — motor memory — and it needs a different kind of rep: hands off
              the keys, chord announced, play it, get timed.
            </p>
            <p>
              This tool is that missing half. Anki keeps the recall side sharp; the
              drill keeps the physical side honest.
            </p>
          </FeatureSection>

          <FeatureSection
            number="04"
            label="how it actually works"
            title="One loop, two directions"
          >
            <p>
              Turn on <strong className="text-foreground">Anki Sync</strong> and the
              loop runs on its own — no manual chord picking, no separate app to
              babysit.
            </p>
            <FlowSection />
          </FeatureSection>

          <FeatureSection
            number="05"
            label="not a new idea"
            title="This is how jazz pianists already practice"
          >
            <p>
              Drilling a voicing through every root, in time, until it stops
              requiring thought, is the standard route from theory to fluency in jazz
              piano — not a shortcut around it. This tool just puts a stopwatch and a
              spaced-repetition schedule underneath a practice habit that already
              exists.
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
            number="06"
            label="the companion deck"
            title="The actual Anki deck behind this"
          >
            <p>
              Two ready-to-import decks: root-position 7ths and diminished 7ths
              across five keys (C-G-D-A-E), and the extended 9/11/13 voicings with
              LH/RH fingering built in. Both are plain tab-separated Anki exports —
              import via Anki&apos;s File → Import (Basic notetype), no add-on beyond
              AnkiConnect needed to use them with this drill.
            </p>
            <DeckSection />
          </FeatureSection>

          <CtaSection />
        </main>

        <footer className="border-t border-border/50 bg-card/80 py-8 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
            Anki MIDI Chord Trainer — a piano practice suite built for spaced
            repetition and real keys.
          </div>
        </footer>
    </div>
  );
}
