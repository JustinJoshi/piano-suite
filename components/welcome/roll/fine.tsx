"use client";

import { useEffect, useRef } from "react";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { RollInterlude, useRollPlayback } from "@/components/roll/roll-passage";
import { RollTicket } from "@/components/roll/ticket";

/**
 * The end of the roll: the coda, *Fine*, and Da capo. The blank tail below
 * is measured so the coda can always reach the tracker bar, however tall
 * the screen — otherwise the last chord could never sound.
 */
export function RollFine() {
  const { config } = useWelcomeConfig();
  const copy = config.roll.fine;
  const { quiet } = useRollPlayback();
  const tailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tail = tailRef.current;
    if (!tail) return;
    const fit = () => {
      const coda = document.querySelector('[data-passage="coda"]');
      const rail = document.querySelector("[data-roll-rail]");
      if (!coda || !rail) return;
      tail.style.setProperty("--tail-extra", "0px");
      const r = rail.getBoundingClientRect();
      const line = Math.max(r.top, 0) + r.height / 2;
      const codaBottom = coda.getBoundingClientRect().bottom + window.scrollY;
      const need = codaBottom + window.innerHeight - line + 12 - document.documentElement.scrollHeight;
      if (need > 0) tail.style.setProperty("--tail-extra", `${Math.ceil(need)}px`);
    };
    // What sits below the coda doesn't depend on anything above it, so only
    // the viewport and the fonts can change how much tail is needed.
    fit();
    let alive = true;
    document.fonts?.ready.then(() => alive && fit());
    window.addEventListener("resize", fit);
    return () => {
      alive = false;
      window.removeEventListener("resize", fit);
    };
  }, []);

  const daCapo = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    quiet(reduced ? 300 : 2200);
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    document.getElementById("hero-title")?.focus({ preventScroll: true });
  };

  return (
    <section className="roll-section roll-fine" aria-labelledby="fine-title">
      <RollInterlude id="coda" label="Coda" caption={config.roll.interludes.coda} className="roll-coda" />
      <div className="roll-row">
        <div />
        <div data-roll-reveal="">
          <h2 id="fine-title" className="roll-fine-word">
            {copy.word}
            <span className="sr-only">: the end of the roll</span>
          </h2>
          <p className="roll-label roll-fine-gloss" aria-hidden="true">
            {copy.gloss}
          </p>
          <p className="roll-fine-text">{copy.text}</p>
          <div className="roll-fine-actions">
            <RollTicket href={config.hero.ctaHref}>{copy.cta}</RollTicket>
            <button type="button" className="roll-dacapo" onClick={daCapo}>
              <span className="roll-dacapo-sign" aria-hidden="true">
                D.C.
              </span>
              <span>
                <span className="roll-dacapo-it">{copy.dacapo}</span>
                <span className="roll-dacapo-sub">{copy.dacapoSub}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
      <div className="roll-tail" ref={tailRef} aria-hidden="true">
        <p className="roll-label roll-tail-end">{copy.tail}</p>
      </div>
    </section>
  );
}
