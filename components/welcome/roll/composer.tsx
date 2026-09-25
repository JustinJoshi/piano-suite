"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAudio } from "@/hooks/useAudio";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { useRollSound } from "@/hooks/useRollSound";
import { playRollSequence, type RollSequenceNote } from "@/lib/roll-audio";
import { RollSectionHead } from "@/components/roll/section-head";
import { RollArrow } from "@/components/roll/ticket";

const glyph = (body: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {body}
  </svg>
);
const dot = (cx: number, cy: number, r = 1.5) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;

const GLYPHS: Record<string, ReactNode> = {
  metronome: glyph(<><path d="M8.6 3.5h6.8L19 20.5H5z" /><path d="M12 17.2 16.2 6.6" />{dot(15.1, 9.4, 1.4)}<path d="M7 15.5h10" /></>),
  drillTimer: glyph(<><circle cx={12} cy={13.6} r={7} /><path d="M10 3.5h4M12 3.5v3.1M18.3 7.2l1.3-1.3" /><path d="M12 13.6 14.8 10.8" /></>),
  restTimer: glyph(<><path d="M4.5 15.5a7.5 7.5 0 0 1 15 0" />{dot(12, 14.6)}<path d="M4 19.5h16" strokeDasharray="1.5 3" /></>),
  chordSets: glyph(<g fill="currentColor" stroke="none"><rect x={3.5} y={5} width={3.4} height={14} rx={1.7} /><rect x={12} y={5} width={3.4} height={14} rx={1.7} /><rect x={17.6} y={5} width={3.4} height={14} rx={1.7} /></g>),
  scaleRuns: glyph(<g fill="currentColor" stroke="none">{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={2.5 + i * 4.2} y={17 - i * 3.2} width={3} height={3.4} rx={1} />)}</g>),
  keyCycles: glyph(<><path d="M19 12a7 7 0 1 1-2.05-4.95" /><path d="M17.3 3.6v3.8h-3.8" />{dot(12, 5, 1.2)}{dot(5, 12, 1.2)}{dot(12, 19, 1.2)}</>),
  progressions: glyph(<>{[[4.5, 9], [4.5, 13], [4.5, 17], [12, 7], [12, 11], [12, 15], [19.5, 10], [19.5, 14], [19.5, 18]].map(([x, y]) => dot(x, y))}</>),
  fallingNotes: glyph(<><g fill="currentColor" stroke="none"><rect x={4.2} y={3} width={2.8} height={8} rx={1.2} /><rect x={10.6} y={6} width={2.8} height={10} rx={1.2} /><rect x={17} y={3.5} width={2.8} height={6} rx={1.2} /></g><path d="M3 20.5h18" /></>),
  sessionStats: glyph(<path d="M5 20v-6M10 20V9M15 20v-8.5M20 20V5.5" strokeWidth={2.2} />),
  keyboard: glyph(<><rect x={2.5} y={5} width={19} height={14} rx={1.6} /><path d="M7.25 12v7M12 12v7M16.75 12v7" /><g fill="currentColor" stroke="none"><rect x={5.9} y={5} width={2.7} height={7.4} rx={0.6} /><rect x={10.65} y={5} width={2.7} height={7.4} rx={0.6} /><rect x={15.4} y={5} width={2.7} height={7.4} rx={0.6} /></g></>),
};

const miniKeys = (
  <svg viewBox="0 0 140 26" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <rect x={0.5} y={0.5} width={139} height={25} rx={2} fill="var(--ivory)" stroke="var(--muted-foreground)" />
    {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M${(i + 1) * 10} .5v25`} stroke="var(--muted-foreground)" strokeWidth={0.8} />)}
    {[0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map((i) => <rect key={i} x={(i + 1) * 10 - 3} y={0.5} width={6} height={15} fill="var(--ebony)" />)}
  </svg>
);
const miniFalling = (
  <svg viewBox="0 0 140 26" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    {[[8, 0, 9], [24, 6, 12], [44, 2, 7], [60, 10, 10], [82, 0, 14], [98, 7, 8], [118, 3, 11], [130, 12, 6]].map(([x, y, h]) => (
      <rect key={x} x={x} y={y} width={5} height={h} rx={1.5} fill="var(--muted-foreground)" />
    ))}
    <path d="M0 25h140" stroke="var(--felt)" strokeWidth={1.5} />
  </svg>
);

/** What each block looks like on the page, and what it sounds like when punched. */
const BLOCKS: Record<string, { wide?: boolean; body: ReactNode; motif: RollSequenceNote[] }> = {
  metronome: { body: <>72 bpm <span aria-hidden="true">· ● ○ ○ ○</span></>, motif: [0, 1, 2, 3].map((t) => ({ p: "tick", t, accent: t === 0 })) },
  drillTimer: { body: <span data-numeric="">0:00.0</span>, motif: [{ p: "tick", t: 0, accent: true }, { p: "tick", t: 0.5 }] },
  restTimer: { body: "Rest, 1:00", motif: [{ p: 48, t: 0, d: 3, v: 0.35 }, { p: 55, t: 0, d: 3, v: 0.3 }] },
  chordSets: { body: "C · F · G7 · Am", motif: [60, 64, 67].map((p) => ({ p, t: 0, d: 2 })) },
  scaleRuns: { body: "C major, two octaves", motif: [60, 62, 64, 65, 67, 65, 64, 62, 60].map((p, i) => ({ p, t: i * 0.5, d: 0.45 })) },
  keyCycles: { body: "Around the circle of fourths", motif: [48, 53, 58, 51].map((p, i) => ({ p, t: i * 0.75, d: 0.7 })) },
  progressions: { body: "ii – V – I", motif: [[62, 65, 69, 72], [62, 65, 67, 71], [60, 64, 67, 71]].flatMap((c, i) => c.map((p) => ({ p, t: i * 1.5, d: i === 2 ? 2 : 1.4 }))) },
  fallingNotes: { wide: true, body: miniFalling, motif: [79, 76, 72, 67].map((p, i) => ({ p, t: i * 0.5, d: 0.5 })) },
  sessionStats: { body: "Reps 0 · best –", motif: [{ p: 84, t: 0, d: 0.4, v: 0.4 }, { p: 79, t: 0.5, d: 0.6, v: 0.4 }] },
  keyboard: { wide: true, body: miniKeys, motif: [{ p: 60, t: 0, d: 1 }] },
};

const listify = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

/** The punch board: press a block to punch it onto today's page. */
export function RollComposer() {
  const { config } = useWelcomeConfig();
  const copy = config.roll.workshop;
  const sound = useRollSound();
  const { playTick } = useAudio();
  const [chosen, setChosen] = useState<string[]>(["chordSets", "drillTimer", "keyboard"]);
  const [fresh, setFresh] = useState<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const stopMotif = useRef<(() => void) | null>(null);

  const dropChad = (button: HTMLButtonElement, id: string) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const punch = button.querySelector<HTMLElement>(".roll-block-punch");
    if (!punch) return;
    const chad = document.createElement("span");
    chad.className = "roll-chad";
    chad.style.left = `${punch.offsetLeft}px`;
    chad.style.top = `${punch.offsetTop}px`;
    // Each block's chad falls its own way.
    chad.style.setProperty("--dx", `${((id.length * 7 + id.charCodeAt(0)) % 17) - 4}px`);
    button.appendChild(chad);
    chad.addEventListener("animationend", () => chad.remove(), { once: true });
  };

  const toggle = (id: string) => {
    if (chosen.includes(id)) {
      setChosen((c) => c.filter((x) => x !== id));
      return;
    }
    setChosen((c) => [...c, id]);
    setFresh(id);
    const button = buttons.current.get(id);
    if (button) dropChad(button, id);
    stopMotif.current?.();
    const audible = sound.on;
    stopMotif.current = playRollSequence(BLOCKS[id]?.motif ?? [], {
      bpm: 150,
      source: `block-${id}`,
      audible,
      onTick: (accent) => {
        if (audible) playTick({ volume: accent ? 0.5 : 0.3 });
      },
      onDone: () => {
        stopMotif.current = null;
      },
    });
  };

  const names = chosen.map((id) => copy.blocks.find((b) => b.id === id)?.phrase ?? id);

  return (
    <section className="roll-section" id="workshop" aria-labelledby="workshop-title">
      <RollSectionHead copy={copy} titleId="workshop-title" />
      <div data-roll-reveal="">
        <div className="roll-composer">
          <div>
            <h3 className="roll-label roll-composer-heading" id="roll-blocks-label">
              Blocks <span className="roll-composer-hint">Press to punch one onto the page</span>
            </h3>
            <ul className="roll-blocks" aria-labelledby="roll-blocks-label">
              {copy.blocks.map((block) => (
                <li key={block.id}>
                  <button
                    type="button"
                    className="roll-block"
                    aria-pressed={chosen.includes(block.id)}
                    ref={(el) => {
                      if (el) buttons.current.set(block.id, el);
                      else buttons.current.delete(block.id);
                    }}
                    onClick={() => toggle(block.id)}
                  >
                    <span className="roll-block-glyph">{GLYPHS[block.id]}</span>
                    <span className="roll-block-name">{block.name}</span>
                    <span className="roll-block-gloss">{block.gloss}</span>
                    <span className="roll-block-punch" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="roll-label roll-composer-heading" id="roll-page-label">
              Your page
            </h3>
            <div className="roll-pagesheet">
              <p className="roll-pagesheet-title">Today</p>
              {chosen.length ? (
                <ul className="roll-pagesheet-grid" aria-labelledby="roll-page-label">
                  {chosen.map((id) => {
                    const block = copy.blocks.find((b) => b.id === id);
                    if (!block) return null;
                    return (
                      <li key={id} className={BLOCKS[id]?.wide ? "roll-tile roll-tile-wide" : "roll-tile"} data-fresh={fresh === id ? "" : undefined}>
                        <span className="roll-tile-head">
                          {GLYPHS[id]}
                          {block.name}
                        </span>
                        <span className="roll-tile-body">{BLOCKS[id]?.body}</span>
                        <button
                          type="button"
                          className="roll-tile-remove"
                          aria-label={`Remove ${block.name}`}
                          onClick={() => {
                            toggle(id);
                            buttons.current.get(id)?.focus();
                          }}
                        >
                          <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
                            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="roll-pagesheet-empty">An empty page. Add a block to start.</p>
              )}
            </div>
            <p className="roll-readout" role="status" aria-live="polite">
              {chosen.length ? `On your page: ${listify(names)}.` : "Nothing on the page yet."}
            </p>
          </div>
        </div>
        <p className="roll-cta">
          <Link href="/tools/workshop" className="roll-btn roll-btn-ink">
            {copy.cta}
            <RollArrow />
          </Link>
          <span className="roll-muted">{copy.ctaNote}</span>
        </p>
      </div>
    </section>
  );
}
