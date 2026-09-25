"use client";

import type { CSSProperties } from "react";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { RollInline } from "@/components/roll/inline";
import { RollTicket } from "@/components/roll/ticket";
import { RollDrillConsole } from "./drill-console";

const intro = (ms: number) => ({ "--intro-delay": `${ms}ms` }) as CSSProperties;

/** The roll's label, the one-sentence headline, the ticket, and a real drill. */
export function RollHero() {
  const { config } = useWelcomeConfig();
  const { hero, roll } = config;
  return (
    <section className="roll-hero" aria-labelledby="hero-title">
      <p className="roll-roll-label" data-roll-intro="" style={intro(60)}>
        <span>{roll.rollLabel.left}</span>
        <span className="roll-roll-label-rule" aria-hidden="true" />
        <span className="roll-roll-label-extra">{roll.rollLabel.middle}</span>
        <span className="roll-roll-label-rule roll-roll-label-extra" aria-hidden="true" />
        <span>{roll.rollLabel.right}</span>
      </p>
      <div className="roll-hero-grid">
        <div className="roll-hero-text">
          {hero.showEyebrow ? (
            <p className="roll-kicker" data-roll-intro="" style={intro(150)}>
              {hero.eyebrow}
            </p>
          ) : null}
          <h1 id="hero-title" tabIndex={-1} className="roll-h1 outline-none" data-roll-intro="" style={intro(240)}>
            <RollInline text={hero.headline} />
          </h1>
          <p className="roll-lede" data-roll-intro="" style={intro(330)}>
            {hero.subheadline}
          </p>
          <div className="roll-hero-actions" data-roll-intro="" style={intro(420)}>
            <RollTicket href={hero.ctaHref}>{hero.ctaText}</RollTicket>
            <p className="roll-hero-meta">
              <RollInline text={roll.heroMeta} />
            </p>
          </div>
        </div>
        <RollDrillConsole copy={roll.console} />
      </div>
    </section>
  );
}
