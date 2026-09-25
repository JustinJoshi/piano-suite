"use client";

import Link from "next/link";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { ROLL_MOTIFS, type RollMotifId } from "@/lib/roll-music";
import { starterTemplates } from "@/lib/starter-templates";
import { RollSectionHead } from "@/components/roll/section-head";

/** Which little sound-shape to print beside each starter page. */
const MOTIF_FOR: Record<string, RollMotifId> = {
  "ten-minute-warmup": "warmup",
  "scale-of-the-day": "scale",
  "five-finger-foundations": "five",
  "circle-of-fourths-chords": "circle",
  "ii-v-i-every-key": "twofive",
  "twelve-bar-blues": "blues",
  "pop-loop": "pop",
  "modes-tour": "modes",
  "hanon-cell-warmup": "hanon",
  "pentatonic-improv": "penta",
};

/** Roman-numeral runs get en dashes, as a programme would print them: ii–V–I. */
export function printNumerals(title: string): string {
  return title.replace(/\b([iIvV]{1,3})-(?=[iIvV]{1,3}\b)/g, "$1–");
}

/** A starter's sound, drawn sideways like a roll-box label: time runs left to right. */
function Motif({ id }: { id: RollMotifId }) {
  const motif = ROLL_MOTIFS[id];
  const W = 76;
  const H = 24;
  const end = Math.max(...motif.map(([, t, d]) => t + d));
  const unit = (W - 2) / end;
  const step = (H - 4) / 11;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true" focusable="false">
      {motif.map(([lane, t, d], i) => (
        <rect key={i} x={t * unit + 1} y={(11 - lane) * step + 0.7} width={Math.max(2.6, d * unit - 1.4)} height={2.6} rx={1.3} />
      ))}
    </svg>
  );
}

/** Ten ready-made pages from the starter registry, set like a roll catalogue. */
export function RollCatalogue() {
  const { config } = useWelcomeConfig();
  const copy = config.roll.pages;
  const entries = copy.starterIds
    .map((id) => starterTemplates.find((t) => t.id === id))
    .filter((t): t is (typeof starterTemplates)[number] => Boolean(t));
  return (
    <section className="roll-section" id="pages" aria-labelledby="pages-title">
      <RollSectionHead copy={copy} titleId="pages-title" />
      <div className="roll-row">
        <div />
        <div>
          <ol className="roll-entries" data-roll-reveal="">
            {entries.map((template, i) => (
              <li key={template.id}>
                <Link className="roll-entry" href="/tools/workshop">
                  <span className="roll-entry-no">{String(i + 1).padStart(2, "0")}</span>
                  <span className="roll-entry-title">{printNumerals(template.title)}</span>
                  <span className="roll-entry-dots" aria-hidden="true" />
                  <span className="roll-entry-motif" aria-hidden="true">
                    {MOTIF_FOR[template.id] ? <Motif id={MOTIF_FOR[template.id]} /> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <p className="roll-go" data-roll-reveal="">
            <Link className="roll-link roll-link-arrow" href="/tools/workshop">
              {copy.go}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
