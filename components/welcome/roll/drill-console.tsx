"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useMidi } from "@/hooks/useMidi";
import { useRollSound } from "@/hooks/useRollSound";
import { computerKeyForOffset, isBlackNote, noteName } from "@/lib/feature-blocks/keyboard-display/keys";
import { isEditableTarget } from "@/lib/keyboard";
import { pressVirtualNote, releaseAllVirtualNotes, releaseVirtualNote } from "@/lib/midi-session";
import {
  CHORD_WINDOW_MS,
  HINT_AFTER_MS,
  ROLL_DRILL_TARGETS,
  activePitchClasses,
  formatSeconds,
  isMiss,
  isTargetPlayed,
  missWords,
  pitchClass,
  spokenSeconds,
  summarize,
  type RollDrillResult,
} from "@/lib/roll-drill";
import { ROLL_LEDGER_EVENT, saveRun } from "@/lib/roll-ledger";
import type { WelcomeRollConfig } from "@/lib/welcome-config";
import { RollInline } from "@/components/roll/inline";
import { MiniRoll } from "./mini-roll";

const FIRST = 60; // C4
const LAST = 76; // E5
const SPOKEN = ["C", "C sharp", "D", "E flat", "E", "F", "F sharp", "G", "A flat", "A", "B flat", "B"];

const KEYS = (() => {
  const keys: Array<{ midi: number; black: boolean; w: number; cap: string | null; label: string }> = [];
  let whites = 0;
  for (let midi = FIRST; midi <= LAST; midi++) {
    const black = isBlackNote(midi);
    keys.push({
      midi,
      black,
      w: whites,
      cap: computerKeyForOffset(midi - FIRST),
      label: `${SPOKEN[pitchClass(midi)]} ${Math.floor(midi / 12) - 1}`,
    });
    if (!black) whites += 1;
  }
  return keys;
})();

const QWERTY = new Map(KEYS.filter((k) => k.cap).map((k) => [k.cap as string, k.midi]));

type Phase = "waiting" | "playing" | "advancing" | "done";

/**
 * The hero's try-it: a real four-chord drill, I–V–vi–IV in C, on the same
 * primitives as every drill in the app — `pressVirtualNote` for the on-screen
 * keys and the QWERTY row, `useMidi()` for held notes (so a MIDI keyboard
 * works too), and `AudioEngineHost` for the sound. It checks which notes are
 * sounding, in any octave, and nothing else.
 */
export function RollDrillConsole({ copy }: { copy: WelcomeRollConfig["console"] }) {
  const midi = useMidi();
  const sound = useRollSound();

  const rootRef = useRef<HTMLElement>(null);
  const keysRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<HTMLElement>(null);
  const doneTitleRef = useRef<HTMLHeadingElement>(null);
  const rollRef = useRef<MiniRoll | null>(null);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [misses, setMisses] = useState(0);
  const [results, setResults] = useState<RollDrillResult[]>([]);
  const [hintFor, setHintFor] = useState<number | null>(null);
  const [activePcs, setActivePcs] = useState<Set<number>>(() => new Set());
  const [chordAnim, setChordAnim] = useState<"in" | "out" | null>(null);
  const [goodNotes, setGoodNotes] = useState<number[]>([]);
  const [cleared, setCleared] = useState<Set<number>>(() => new Set());
  const [status, setStatus] = useState("");
  const [played, setPlayed] = useState(false);
  const [focusMidi, setFocusMidi] = useState(FIRST);

  // Mutable drill state for event handlers and timers.
  const phaseRef = useRef<Phase>("waiting");
  const idxRef = useRef(0);
  const missesRef = useRef(0);
  const resultsRef = useRef<RollDrillResult[]>([]);
  const startedAt = useRef(0);
  const released = useRef(new Map<number, number>());
  const prevHeld = useRef(new Set<number>());
  const onScreen = useRef(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockFrame = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const want = sound.want;
  // `evaluate` re-runs itself from timers; a ref keeps that out of its own deps.
  const evaluateRef = useRef<() => void>(() => {});

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const reduced = useCallback(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // ---------- the mini roll ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    const keysEl = keysRef.current;
    if (!canvas || !keysEl) return;
    const css = getComputedStyle(canvas);
    const roll = new MiniRoll(
      canvas,
      (note) => {
        const folded = note >= FIRST && note <= LAST ? note : FIRST + pitchClass(note);
        const key = keysEl.querySelector<HTMLElement>(`[data-midi="${folded}"]`);
        if (!key) return 0.5;
        const c = canvas.getBoundingClientRect();
        const k = key.getBoundingClientRect();
        return (k.left + k.width / 2 - c.left) / (c.width || 1);
      },
      {
        hole: css.getPropertyValue("--hole").trim() || "#241c16",
        felt: css.getPropertyValue("--felt").trim() || "#a4262c",
        miss: css.getPropertyValue("--muted-foreground").trim() || "#4a4238",
        label: css.getPropertyValue("--font-archivo").trim() || "sans-serif",
      },
      reduced
    );
    rollRef.current = roll;
    return () => roll.dispose();
  }, [reduced]);

  // ---------- the clock ----------
  // Written straight to the DOM each frame; a re-render per frame would be waste.
  const startClock = useCallback(() => {
    startedAt.current = performance.now();
    const tick = () => {
      clockFrame.current = 0;
      if (phaseRef.current !== "playing") return;
      if (timeRef.current) timeRef.current.textContent = formatSeconds(performance.now() - startedAt.current);
      clockFrame.current = requestAnimationFrame(tick);
    };
    if (!clockFrame.current) clockFrame.current = requestAnimationFrame(tick);
  }, []);

  const setPhaseBoth = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  // ---------- hints ----------
  const armHint = useCallback(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    const forIdx = idxRef.current;
    hintTimer.current = setTimeout(() => {
      if (idxRef.current === forIdx && phaseRef.current !== "done") setHintFor(forIdx);
    }, HINT_AFTER_MS);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (typeof IntersectionObserver !== "function") {
      onScreen.current = true;
      armHint();
      return;
    }
    let armed = false;
    const observer = new IntersectionObserver(([entry]) => {
      onScreen.current = entry.isIntersecting;
      if (entry.isIntersecting && !armed) {
        armed = true;
        armHint();
      }
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [armHint]);

  // ---------- the drill ----------
  const finish = useCallback(() => {
    setPhaseBoth("done");
    const { totalMs, misses: total } = summarize(resultsRef.current);
    setStatus(`Done. All four chords in ${spokenSeconds(totalMs)}, with ${missWords(total)}.`);
    saveRun({ at: Date.now(), results: resultsRef.current });
    window.dispatchEvent(new Event(ROLL_LEDGER_EVENT));
  }, []);

  const evaluate = useCallback(() => {
    const now = performance.now();
    for (const [note, at] of released.current) {
      if (now - at >= CHORD_WINDOW_MS) released.current.delete(note);
    }
    const pcs = activePitchClasses(prevHeld.current, released.current, now);
    setActivePcs(pcs);
    if (phaseRef.current !== "playing") return;
    const target = ROLL_DRILL_TARGETS[idxRef.current];
    if (!isTargetPlayed(target, pcs)) return;

    // Played it.
    const ms = now - startedAt.current;
    setPhaseBoth("advancing");
    if (timeRef.current) timeRef.current.textContent = formatSeconds(ms);
    const result = { name: target.short, ms: Math.round(ms), misses: missesRef.current };
    resultsRef.current = [...resultsRef.current, result];
    setResults(resultsRef.current);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setHintFor(null);
    const formed = [...new Set([...prevHeld.current, ...released.current.keys()])];
    rollRef.current?.markGood(formed, formatSeconds(ms));
    setGoodNotes(formed);
    later(() => setGoodNotes([]), 650);
    const next = ROLL_DRILL_TARGETS[idxRef.current + 1];
    setStatus(`${target.name} in ${spokenSeconds(ms)}.${next ? ` Next: ${next.name}, ${next.spell.join(", ")}.` : ""}`);

    later(() => {
      if (idxRef.current + 1 >= ROLL_DRILL_TARGETS.length) {
        finish();
        return;
      }
      const swap = () => {
        // Notes let go of during the pause don't count toward the new chord.
        setCleared(new Set(released.current.keys()));
        released.current.clear();
        idxRef.current += 1;
        setIdx(idxRef.current);
        missesRef.current = 0;
        setMisses(0);
        setChordAnim(reduced() ? null : "in");
        setPhaseBoth("playing");
        startClock();
        armHint();
        evaluateRef.current();
      };
      if (reduced()) swap();
      else {
        setChordAnim("out");
        later(swap, 170);
      }
    }, 800);
  }, [armHint, finish, later, reduced, startClock]);

  useEffect(() => {
    evaluateRef.current = evaluate;
  }, [evaluate]);

  // Held notes come from the MIDI session: on-screen keys, QWERTY, or a MIDI keyboard.
  useEffect(() => {
    const held = new Set(midi.heldNotes);
    const prev = prevHeld.current;
    const now = performance.now();
    const pressed = [...held].filter((n) => !prev.has(n));
    const lifted = [...prev].filter((n) => !held.has(n));
    prevHeld.current = held;

    for (const note of pressed) {
      released.current.delete(note);
      setCleared((c) => {
        if (!c.has(note)) return c;
        const next = new Set(c);
        next.delete(note);
        return next;
      });
      want();
      setPlayed(true);
      const hole = rollRef.current?.punch(note);
      if (phaseRef.current === "waiting") {
        setPhaseBoth("playing");
        startClock();
      }
      if (phaseRef.current === "playing" && isMiss(ROLL_DRILL_TARGETS[idxRef.current], note)) {
        missesRef.current += 1;
        setMisses(missesRef.current);
        rollRef.current?.markMiss(hole);
      }
    }
    for (const note of lifted) {
      released.current.set(note, now);
      rollRef.current?.lift(note);
      later(() => evaluateRef.current(), CHORD_WINDOW_MS + 20);
    }
    if (pressed.length || lifted.length) evaluate();
  }, [midi.heldNotes, evaluate, later, startClock, want]);

  // ---------- input: pointer (click, tap, multi-touch, glissando) ----------
  const pointers = useRef(new Map<number, number | null>());
  const onPointerDown = (event: React.PointerEvent) => {
    const key = (event.target as HTMLElement).closest<HTMLElement>("[data-midi]");
    if (!key || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    const r = key.getBoundingClientRect();
    const depth = Math.min(1, Math.max(0, (event.clientY - r.top) / r.height));
    const note = Number(key.dataset.midi);
    pointers.current.set(event.pointerId, note);
    pressVirtualNote(note, Math.round(58 + depth * 44));
  };
  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return;
    const el = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-midi]");
    const note = el && keysRef.current?.contains(el) ? Number(el.dataset.midi) : null;
    const prev = pointers.current.get(event.pointerId) ?? null;
    if (note === prev) return;
    if (prev != null) releaseVirtualNote(prev);
    pointers.current.set(event.pointerId, note);
    if (note != null) pressVirtualNote(note, 72);
  };
  useEffect(() => {
    const end = (event: PointerEvent) => {
      if (!pointers.current.has(event.pointerId)) return;
      const note = pointers.current.get(event.pointerId);
      pointers.current.delete(event.pointerId);
      if (note != null) releaseVirtualNote(note);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  // ---------- input: the computer keyboard, while the console is on screen ----------
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      const note = QWERTY.get(event.key.toLowerCase());
      // Live while the console is on screen, or while focus is inside it.
      const focused = rootRef.current?.contains(document.activeElement) ?? false;
      if (note == null || (!onScreen.current && !focused)) return;
      event.preventDefault();
      if (!event.repeat) pressVirtualNote(note, 84);
    };
    const up = (event: KeyboardEvent) => {
      const note = QWERTY.get(event.key.toLowerCase());
      if (note != null) releaseVirtualNote(note);
    };
    const blur = () => releaseAllVirtualNotes();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      releaseAllVirtualNotes();
    };
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      if (clockFrame.current) cancelAnimationFrame(clockFrame.current);
    };
  }, []);

  // ---------- input: focus (arrows move, Space or Enter plays) ----------
  const lastKeyboardPlay = useRef(0);
  const onKeysKeyDown = (event: React.KeyboardEvent) => {
    const key = (event.target as HTMLElement).closest<HTMLElement>("[data-midi]");
    if (!key) return;
    const i = KEYS.findIndex((k) => k.midi === Number(key.dataset.midi));
    let j: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") j = Math.min(KEYS.length - 1, i + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") j = Math.max(0, i - 1);
    else if (event.key === "Home") j = 0;
    else if (event.key === "End") j = KEYS.length - 1;
    if (j != null) {
      event.preventDefault();
      setFocusMidi(KEYS[j].midi);
      keysRef.current?.querySelector<HTMLElement>(`[data-midi="${KEYS[j].midi}"]`)?.focus();
      return;
    }
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (!event.repeat) {
        lastKeyboardPlay.current = performance.now();
        pressVirtualNote(KEYS[i].midi, 84);
      }
    }
  };
  const onKeysKeyUp = (event: React.KeyboardEvent) => {
    const key = (event.target as HTMLElement).closest<HTMLElement>("[data-midi]");
    if (key && (event.key === " " || event.key === "Enter")) releaseVirtualNote(Number(key.dataset.midi));
  };
  // Assistive tech often sends a bare click: play a short note for it.
  const onKeysClick = (event: React.MouseEvent) => {
    if (event.detail !== 0 || performance.now() - lastKeyboardPlay.current < 600) return;
    const key = (event.target as HTMLElement).closest<HTMLElement>("[data-midi]");
    if (!key) return;
    const note = Number(key.dataset.midi);
    pressVirtualNote(note, 80);
    later(() => releaseVirtualNote(note), 320);
  };

  const again = () => {
    idxRef.current = 0;
    missesRef.current = 0;
    resultsRef.current = [];
    released.current.clear();
    setIdx(0);
    setMisses(0);
    setResults([]);
    setHintFor(null);
    setChordAnim(null);
    setPhaseBoth("waiting");
    if (timeRef.current) timeRef.current.textContent = "–";
    armHint();
    setStatus("Again, from the top. Play C major: C, E, G.");
    keysRef.current?.querySelector<HTMLElement>(`[data-midi="${focusMidi}"]`)?.focus();
  };

  const target = ROLL_DRILL_TARGETS[idx];
  const held = useMemo(() => new Set(midi.heldNotes), [midi.heldNotes]);
  const { totalMs, misses: totalMisses } = summarize(results);
  const inputNames = midi.inputs.map((input) => input.name).join(", ");

  return (
    <section className="roll-console" aria-labelledby="roll-console-title" ref={rootRef} data-roll-intro style={{ "--intro-delay": "500ms" } as CSSProperties}>
      {phase !== "done" ? (
        <div className="roll-console-head">
          <div>
            <h2 className="roll-label roll-console-title" id="roll-console-title">
              {copy.title}
              <span className="sr-only">: a four-chord drill</span>
            </h2>
            <p className="roll-console-target">
              <span className="roll-console-verb">{copy.verb}</span>{" "}
              <span
                className="roll-console-chord"
                data-out={chordAnim === "out" ? "" : undefined}
                data-in={chordAnim === "in" ? "" : undefined}
                key={`chord-${idx}`}
              >
                {target.name}
              </span>
            </p>
            <p className="roll-spell" aria-label={`Notes: ${target.spell.join(", ")}`}>
              {target.spell.map((letter, i) => (
                <span key={letter} className="roll-pc" data-on={activePcs.has(target.pcs[i]) ? "" : undefined} aria-hidden="true">
                  {letter}
                </span>
              ))}
            </p>
          </div>
          <dl className="roll-stats">
            <div className="roll-stat">
              <dt>Chord</dt>
              <dd>
                <span className="roll-progress" aria-hidden="true">
                  {ROLL_DRILL_TARGETS.map((t, i) => (
                    <i key={t.short} data-done={i < idx || (i === idx && phase === "advancing") ? "" : undefined} data-current={i === idx ? "" : undefined} />
                  ))}
                </span>{" "}
                {idx + 1} of {ROLL_DRILL_TARGETS.length}
              </dd>
            </div>
            <div className="roll-stat">
              <dt>Time</dt>
              <dd ref={timeRef as React.RefObject<HTMLElement>} data-numeric="">
                –
              </dd>
            </div>
            <div className="roll-stat">
              <dt>Misses</dt>
              <dd data-numeric="">{misses}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="roll-console-done" data-in="">
          <p className="roll-label">{copy.doneLabel}</p>
          <h3 className="roll-console-donetitle" tabIndex={-1} ref={doneTitleRef}>
            {copy.doneTitle}
          </h3>
          <p>
            {copy.doneSummary
              .replace("{time}", spokenSeconds(totalMs))
              .replace("{misses}", missWords(totalMisses))}
          </p>
          <p>{copy.doneNext}</p>
          <div className="roll-console-doneactions">
            <Link href={copy.doneCtaHref} className="roll-btn roll-btn-ink">
              {copy.doneCta}
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
                <path d="M4 10h11M11 5.5 15.5 10 11 14.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <button type="button" className="roll-btn roll-btn-line" onClick={again}>
              {copy.again}
            </button>
          </div>
        </div>
      )}

      <div className="roll-miniroll">
        <canvas ref={canvasRef} aria-hidden="true" />
        <p className="roll-miniroll-note" aria-hidden="true" data-hidden={played ? "" : undefined}>
          {copy.rollNote}
        </p>
      </div>
      <div className="roll-keybed">
        <div
          className="roll-keys"
          role="group"
          aria-label="On-screen piano, C4 to E5"
          ref={keysRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onKeyDown={onKeysKeyDown}
          onKeyUp={onKeysKeyUp}
          onClick={onKeysClick}
          onContextMenu={(e) => e.preventDefault()}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) releaseAllVirtualNotes();
          }}
        >
          {KEYS.map((key) => (
            <button
              key={key.midi}
              type="button"
              data-midi={key.midi}
              aria-label={key.label}
              tabIndex={key.midi === focusMidi ? 0 : -1}
              onFocus={() => setFocusMidi(key.midi)}
              className={key.black ? "roll-key roll-key-black" : "roll-key roll-key-white"}
              style={{ "--w": key.w } as CSSProperties}
              data-down={held.has(key.midi) ? "" : undefined}
              data-hint={hintFor === idx && phase !== "done" && target.hint.includes(key.midi) ? "" : undefined}
              data-good={goodNotes.includes(key.midi) ? "" : undefined}
              data-cleared={cleared.has(key.midi) ? "" : undefined}
            >
              {key.cap ? (
                <span className="roll-key-cap" aria-hidden="true">
                  {key.cap.toUpperCase()}
                </span>
              ) : null}
              {!key.black ? (
                <span className="roll-key-note" aria-hidden="true">
                  {noteName(key.midi)}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <div className="roll-console-foot">
        <p className="roll-console-help roll-help-fine">
          <RollInline text={copy.helpFine} />
        </p>
        <p className="roll-console-help roll-help-touch">
          <RollInline text={copy.helpTouch} />
        </p>
        {midi.supported ? (
          <p className="roll-console-midi">
            {midi.connected ? (
              <span role="status">
                {inputNames ? `Listening to ${inputNames}.` : "No MIDI keyboard found yet. Plug one in and it will be picked up."}
              </span>
            ) : (
              <>
                <button type="button" className="roll-link-btn" onClick={() => void midi.connect()}>
                  {copy.midi}
                </button>
                {midi.error ? <span role="status"> The browser didn’t allow MIDI access. The on-screen keys still work.</span> : null}
              </>
            )}
          </p>
        ) : null}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
