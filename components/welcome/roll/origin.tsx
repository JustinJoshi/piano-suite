"use client";

import { Download } from "lucide-react";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { RollInline } from "@/components/roll/inline";
import { RollFlashcard } from "./flashcard";

/** Where it came from: the builder's story, a flashcard, and the decks. */
export function RollOrigin() {
  const { config } = useWelcomeConfig();
  const copy = config.roll.origin;
  const decks = config.decks.items;
  return (
    <section className="roll-section" id="origin" aria-labelledby="origin-title">
      <div className="roll-row">
        <div className="roll-margin" data-roll-reveal="">
          <p className="roll-label">{copy.label}</p>
          <p className="roll-note">{copy.note}</p>
        </div>
        <div className="roll-origin-grid">
          <div className="roll-prose" data-roll-reveal="">
            <h2 id="origin-title" className="roll-h2" style={{ marginBottom: 30 }}>
              {copy.title}
            </h2>
            {copy.paragraphs.map((p) => (
              <p key={p.slice(0, 24)}>
                <RollInline text={p} />
              </p>
            ))}
            <p className="roll-origin-turn">{copy.turn}</p>
            <p>{copy.closing}</p>
            <p className="roll-signoff">{copy.signoff}</p>
            <p>
              <RollInline text={copy.story} linkClassName="roll-link roll-link-arrow" />
            </p>
            {decks.length ? (
              <div className="roll-decks">
                <span className="roll-muted" style={{ width: "100%" }}>
                  {copy.decksIntro}
                </span>
                {decks.map((deck) => (
                  <a key={deck.href} href={deck.href} download className="roll-link roll-deck">
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {deck.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
          <RollFlashcard caption={copy.cardCaption} />
        </div>
      </div>
    </section>
  );
}
