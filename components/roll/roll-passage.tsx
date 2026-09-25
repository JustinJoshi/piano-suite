"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useRollSound } from "@/hooks/useRollSound";
import { releaseRollSource, rollNoteOff, rollNoteOn } from "@/lib/roll-audio";
import {
  LOOP_TEMPI,
  ROLL_LOW,
  ROLL_PASSAGES,
  notesSoundingAt,
  type RollPassage,
  type RollPassageId,
} from "@/lib/roll-music";

/** More than this many beats in one frame is skimming: light the bar, stay quiet. */
const SKIM_BEATS = 3.2;

type Registered = {
  el: HTMLElement;
  passage: RollPassage;
  holes: HTMLElement[];
  source: string;
  on: Set<number>;
  prev: number | null;
};

type PlaybackContextValue = {
  register: (entry: Omit<Registered, "on" | "prev" | "source">) => () => void;
  /** Programmatic scrolls (Da capo, anchors) light the roll but make no sound. */
  quiet: (ms: number) => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

/**
 * Plays the page's passages as they pass the tracker bar. Scrolling is the
 * crank: slow scrolling plays slowly, scrolling back plays backwards. The
 * reading line is the middle of the bar's rail (`[data-roll-rail]`).
 */
export function RollPlaybackProvider({ children }: { children: ReactNode }) {
  const items = useRef<Registered[]>([]);
  const quietUntil = useRef(0);
  const counter = useRef(0);
  const { on: soundOn } = useRollSound();
  const soundRef = useRef(soundOn);
  const frameRef = useRef<() => void>(() => {});

  useEffect(() => {
    soundRef.current = soundOn;
    // Sound changed: let go of what is sounding so it restarts on the right channel.
    for (const it of items.current) {
      for (const idx of it.on) rollNoteOff(it.passage.notes[idx].p, `${it.source}:${idx}`);
      it.on.clear();
    }
    frameRef.current();
  }, [soundOn]);

  useEffect(() => {
    let raf = 0;
    const frame = () => {
      raf = 0;
      const rail = document.querySelector("[data-roll-rail]");
      if (!rail) return;
      const r = rail.getBoundingClientRect();
      const line = r.top + r.height / 2;
      const quiet = performance.now() < quietUntil.current;
      for (const it of items.current) {
        const box = it.el.getBoundingClientRect();
        const local = line - box.top;
        const inside = box.height > 0 && local >= 0 && local <= box.height;
        const beat = inside ? (local / box.height) * it.passage.beats : null;
        const next = new Set(beat == null ? [] : notesSoundingAt(it.passage, beat));
        const jump = beat == null || it.prev == null ? 0 : Math.abs(beat - it.prev);
        const audible = soundRef.current && !quiet && jump < SKIM_BEATS;
        for (const idx of it.on) {
          if (next.has(idx)) continue;
          it.holes[idx]?.removeAttribute("data-on");
          rollNoteOff(it.passage.notes[idx].p, `${it.source}:${idx}`);
        }
        for (const idx of next) {
          if (it.on.has(idx)) continue;
          const note = it.passage.notes[idx];
          it.holes[idx]?.setAttribute("data-on", "");
          rollNoteOn(note.p, `${it.source}:${idx}`, { velocity: note.v ?? 0.62, audible });
        }
        it.on = next;
        it.prev = beat;
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    frameRef.current = schedule;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
      releaseRollSource("roll-passage");
    };
  }, []);

  const register = useCallback<PlaybackContextValue["register"]>((entry) => {
    const item: Registered = {
      ...entry,
      source: `roll-passage-${counter.current++}`,
      on: new Set(),
      prev: null,
    };
    items.current.push(item);
    frameRef.current();
    return () => {
      items.current = items.current.filter((x) => x !== item);
      releaseRollSource(item.source);
    };
  }, []);

  const quiet = useCallback((ms: number) => {
    quietUntil.current = performance.now() + ms;
  }, []);

  const value = useMemo(() => ({ register, quiet }), [register, quiet]);
  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>;
}

export function useRollPlayback(): PlaybackContextValue {
  return useContext(PlaybackContext) ?? { register: () => () => {}, quiet: () => {} };
}

/** A passage of holes punched across the roll's lanes. Decorative to assistive tech. */
export function RollPassageView({ id, className }: { id: RollPassageId; className?: string }) {
  const passage = ROLL_PASSAGES[id];
  const ref = useRef<HTMLDivElement>(null);
  const { register } = useRollPlayback();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const holes = Array.from(el.querySelectorAll<HTMLElement>("[data-hole]"));
    return register({ el, passage, holes });
  }, [passage, register]);

  return (
    <div
      ref={ref}
      className={["roll-passage", className].filter(Boolean).join(" ")}
      data-passage={id}
      aria-hidden="true"
      style={{ "--beats": passage.beats } as CSSProperties}
    >
      {passage.notes.map((note, i) => (
        <span
          key={i}
          data-hole=""
          className={note.d >= 0.5 ? "roll-hole roll-hole-chain" : "roll-hole"}
          style={{ "--i": note.p - ROLL_LOW, "--t": note.t, "--d": note.d } as CSSProperties}
        />
      ))}
      {id === "loop"
        ? passage.starts?.map((t, i) => (
            <span key={`pass-${i}`}>
              <span className="roll-pass-line" style={{ "--t": t } as CSSProperties} />
              <span className="roll-pass-label" style={{ "--t": t } as CSSProperties}>
                <b>Pass {i + 1}</b>
                {LOOP_TEMPI[i]} bpm
              </span>
            </span>
          ))
        : null}
    </div>
  );
}

/** A passage between sections, captioned in the margin. */
export function RollInterlude({
  id,
  label = "Interlude",
  caption,
  className,
}: {
  id: RollPassageId;
  label?: string;
  caption: string;
  className?: string;
}) {
  return (
    <div className={["roll-row roll-interlude", className].filter(Boolean).join(" ")} aria-hidden="true">
      <p className="roll-margin roll-caption">
        <span className="roll-label">{label}</span>
        {caption}
      </p>
      <div>
        <RollPassageView id={id} />
      </div>
    </div>
  );
}
