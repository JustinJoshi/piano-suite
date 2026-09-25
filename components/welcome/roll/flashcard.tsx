"use client";

import { useEffect, useRef, useState } from "react";
import { useRollSound } from "@/hooks/useRollSound";
import { playRollSequence } from "@/lib/roll-audio";

/** A chord-symbol card like the ones the project started with. */
const CARDS = [
  { q: "Dm7", a: ["D", "F", "A", "C"], pcs: [2, 5, 9, 0], notes: [50, 62, 65, 69, 72] },
  { q: "G7", a: ["G", "B", "D", "F"], pcs: [7, 11, 2, 5], notes: [55, 59, 62, 65, 67] },
  { q: "Cmaj7", a: ["C", "E", "G", "B"], pcs: [0, 4, 7, 11], notes: [48, 60, 64, 67, 71] },
  { q: "Am7", a: ["A", "C", "E", "G"], pcs: [9, 0, 4, 7], notes: [57, 60, 64, 67, 69] },
  { q: "Fmaj7", a: ["F", "A", "C", "E"], pcs: [5, 9, 0, 4], notes: [53, 57, 60, 64, 65] },
  { q: "Em7", a: ["E", "G", "B", "D"], pcs: [4, 7, 11, 2], notes: [52, 62, 64, 67, 71] },
];
const GRADES = [
  { label: "Again", short: "1 min", when: "in a minute" },
  { label: "Hard", short: "10 min", when: "in ten minutes" },
  { label: "Good", short: "1 day", when: "tomorrow" },
  { label: "Easy", short: "4 days", when: "in four days" },
];
const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK: Array<[pc: number, left: number]> = [[1, 1], [3, 2], [6, 4], [8, 5], [10, 6]];

function OctaveKeys({ pcs }: { pcs: number[] }) {
  const kw = 26;
  return (
    <svg viewBox={`0 0 ${WHITE.length * kw} 46`} aria-hidden="true" focusable="false">
      {WHITE.map((pc, i) => (
        <g key={pc}>
          <rect x={i * kw + 0.75} y={0.75} width={kw - 1.5} height={44.5} rx={2.5} fill="var(--ivory)" stroke="var(--muted-foreground)" strokeWidth={1.2} />
          {pcs.includes(pc) ? <circle cx={i * kw + kw / 2} cy={35} r={5} fill="var(--felt)" /> : null}
        </g>
      ))}
      {BLACK.map(([pc, left]) => (
        <rect key={pc} x={left * kw - 8} y={0.75} width={16} height={27} rx={2} fill={pcs.includes(pc) ? "var(--felt)" : "var(--ebony)"} />
      ))}
    </svg>
  );
}

export function RollFlashcard({ caption }: { caption: string }) {
  const sound = useRollSound();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [phase, setPhase] = useState<"idle" | "filing" | "arriving">("idle");
  const [status, setStatus] = useState("");
  const cardRef = useRef<HTMLButtonElement>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const card = CARDS[i];

  useEffect(() => () => stopRef.current?.(), []);

  const flip = () => {
    if (phase === "filing") return;
    const next = !flipped;
    setFlipped(next);
    if (next) {
      setStatus("");
      stopRef.current?.();
      stopRef.current = playRollSequence(
        card.notes.map((p, k) => ({ p, t: k * 0.06, d: 2.4, v: 0.5 })),
        { bpm: 60, source: "flashcard", audible: sound.want() }
      );
    }
  };

  const grade = (n: number) => {
    if (phase === "filing") return;
    stopRef.current?.();
    setStatus(`${card.q} comes back ${GRADES[n].when}.`);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = () => {
      setI((x) => (x + 1) % CARDS.length);
      setFlipped(false);
      setPhase(reduced ? "idle" : "arriving");
      requestAnimationFrame(() => cardRef.current?.focus({ preventScroll: true }));
    };
    if (reduced) next();
    else {
      setPhase("filing");
      setTimeout(next, 420);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!flipped || event.metaKey || event.ctrlKey || event.altKey) return;
    const n = ["1", "2", "3", "4"].indexOf(event.key);
    if (n >= 0) {
      event.preventDefault();
      grade(n);
    }
  };

  return (
    <figure className="roll-flashcard" data-roll-reveal="" onKeyDown={onKeyDown}>
      <div className="roll-card-stack">
        <button
          ref={cardRef}
          type="button"
          className="roll-card"
          data-flipped={flipped ? "" : undefined}
          data-filing={phase === "filing" ? "" : undefined}
          data-arriving={phase === "arriving" ? "" : undefined}
          onAnimationEnd={() => phase === "arriving" && setPhase("idle")}
          onClick={flip}
          aria-label={
            flipped
              ? `Flashcard. ${card.q} is ${card.a.join(", ")}. Press to see the front again.`
              : `Flashcard: ${card.q}. Which notes are in it? Press to turn it over.`
          }
        >
          <span className="roll-card-inner">
            <span className="roll-card-face roll-card-front">
              <span className="roll-label roll-card-deck">Chords · sevenths</span>
              <span className="roll-card-q">{card.q}</span>
              <span className="roll-card-hint">Which notes? Turn it over.</span>
            </span>
            <span className="roll-card-face roll-card-back">
              <span className="roll-card-deck-q">{card.q}</span>
              <span className="roll-card-a">{card.a.join(" · ")}</span>
              <span className="roll-card-keys">
                <OctaveKeys pcs={card.pcs} />
              </span>
            </span>
          </span>
        </button>
      </div>
      {flipped && phase !== "filing" ? (
        <div className="roll-grades" data-in="">
          <p className="roll-grades-ask" id="roll-grades-ask">
            How did that go?
          </p>
          <div className="roll-grades-row" role="group" aria-labelledby="roll-grades-ask">
            {GRADES.map((g, n) => (
              <button key={g.label} type="button" className="roll-grade" onClick={() => grade(n)}>
                <span>{g.label}</span>
                <small>{g.short}</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <figcaption>
        {caption}{" "}
        <span className="roll-card-status" role="status" aria-live="polite">
          {status}
        </span>
      </figcaption>
    </figure>
  );
}
