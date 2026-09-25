"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { useRollSound } from "@/hooks/useRollSound";
import { playRollSequence } from "@/lib/roll-audio";
import { ROLL_PASSAGES, type RollPassageId } from "@/lib/roll-music";
import { RollPassageView } from "@/components/roll/roll-passage";
import { RollSectionHead } from "@/components/roll/section-head";

/** Only one "Hear it" plays at a time, page-wide. */
let stopCurrent: (() => void) | null = null;

function HearButton({ id, name }: { id: RollPassageId; name: string }) {
  const [playing, setPlaying] = useState(false);
  const sound = useRollSound();
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRef.current?.(), []);

  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (playing) {
      stopRef.current?.();
      return;
    }
    stopCurrent?.();
    const audible = sound.want();
    const track = event.currentTarget.closest("[data-track]");
    const holes = Array.from(document.querySelectorAll<HTMLElement>(`[data-passage="${id}"] [data-hole]`));
    track?.setAttribute("data-playing", "");
    setPlaying(true);
    const passage = ROLL_PASSAGES[id];
    const stop = playRollSequence(passage.notes, {
      bpm: passage.bpm,
      source: `hear-${id}`,
      audible,
      onStart: (i) => holes[i]?.setAttribute("data-on", ""),
      onEnd: (i) => holes[i]?.removeAttribute("data-on"),
      onDone: () => {
        track?.removeAttribute("data-playing");
        setPlaying(false);
        if (stopCurrent === stop) stopCurrent = null;
        stopRef.current = null;
      },
    });
    stopRef.current = stop;
    stopCurrent = stop;
  };

  return (
    <button
      type="button"
      className="roll-hear"
      aria-pressed={playing}
      aria-label={`${playing ? "Stop" : "Hear"} ${name}`}
      onClick={toggle}
    >
      <span className="roll-hear-icon" aria-hidden="true" />
      <span>{playing ? "Stop" : "Hear it"}</span>
    </button>
  );
}

/** The four ready-made drills, each shown as what it sounds like on a roll. */
export function RollDrills() {
  const { config } = useWelcomeConfig();
  const copy = config.roll.drills;
  return (
    <section className="roll-section" id="drills" aria-labelledby="drills-title">
      <RollSectionHead copy={copy} titleId="drills-title" />
      <ol className="roll-tracks">
        {copy.items.map((item, i) => (
          <li key={item.id} className="roll-row roll-track" data-track="">
            <div className="roll-margin roll-track-text">
              <p className="roll-label roll-track-no">No. {i + 1}</p>
              <h3 className="roll-track-name">
                <Link href={item.href}>{item.name}</Link>
              </h3>
              <p className="roll-track-desc">{item.description}</p>
              {item.id in ROLL_PASSAGES ? <HearButton id={item.id as RollPassageId} name={item.name} /> : null}
            </div>
            <div>{item.id in ROLL_PASSAGES ? <RollPassageView id={item.id as RollPassageId} /> : null}</div>
          </li>
        ))}
      </ol>
      <div className="roll-row">
        <div />
        <p className="roll-go" data-roll-reveal="">
          <Link className="roll-link roll-link-arrow" href={copy.goHref}>
            {copy.go}
          </Link>
          <span className="roll-muted">{copy.goNote}</span>
        </p>
      </div>
    </section>
  );
}
