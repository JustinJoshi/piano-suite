"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BlackKeyShadowShape,
  BlackKeyShape,
  KeybedRail,
  WhiteKeyShape,
} from "@/components/brand/keybed";
import { useMidi } from "@/hooks/useMidi";
import { nameHeldNotes } from "@/lib/chord-naming";
import { computerKeyForOffset } from "@/lib/feature-blocks/keyboard-display/keys";
import { buildKeybedGeometry } from "@/lib/keybed";
import { isEditableTarget } from "@/lib/keyboard";
import {
  pressVirtualNote,
  releaseAllVirtualNotes,
  releaseVirtualNote,
} from "@/lib/midi-session";
import { cn } from "@/lib/utils";

/** QWERTY piano starts on middle C, which both the phone and desktop ranges include. */
const QWERTY_BASE_NOTE = 60;
const QWERTY_OFFSETS: ReadonlyMap<string, number> = (() => {
  const offsets = new Map<string, number>();
  for (let offset = 0; offset < 18; offset += 1) {
    const cap = computerKeyForOffset(offset);
    if (cap) offsets.set(cap, offset);
  }
  return offsets;
})();

/** Idle suggestion: a Cmaj7 around middle C — the first "grown-up" chord. */
const IDLE_HINT = [60, 64, 67, 71];

/** Pressing near a key's front edge plays louder, like leaning into it. */
function velocityFromDepth(depth: number): number {
  const clamped = Math.min(1, Math.max(0, depth));
  return Math.round(58 + clamped * 44);
}

type Range = { lowNote: number; octaves: number };

/** C3–C6 on wider screens; one fat octave (C4–C5) where a thumb has to hit it. */
const DESKTOP_RANGE: Range = { lowNote: 48, octaves: 3 };
const PHONE_RANGE: Range = { lowNote: 60, octaves: 1 };

/** Matches Tailwind's `sm` breakpoint, which switches the two keybeds. */
function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639.98px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return narrow;
}

function useKeybedLayout({ lowNote, octaves }: Range) {
  return useMemo(() => {
    const geometry = buildKeybedGeometry(octaves, { closingC: true });
    const centreOf = new Map<number, number>();
    for (const key of [...geometry.whiteKeys, ...geometry.blackKeys]) {
      centreOf.set(lowNote + key.semitone, (key.x + key.width / 2) / geometry.width);
    }
    return { geometry, centreOf };
  }, [lowNote, octaves]);
}

function KeybedSvg({
  lowNote,
  octaves,
  held,
  hint,
  className,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
}: Range & {
  held: Set<number>;
  hint: Set<number>;
  className?: string;
  onPointerDown: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (event: React.PointerEvent<SVGSVGElement>) => void;
  onPointerEnd: (event: React.PointerEvent<SVGSVGElement>) => void;
}) {
  const { geometry } = useKeybedLayout({ lowNote, octaves });
  const hintColor =
    "color-mix(in oklab, var(--color-primary) 42%, var(--color-ivory))";
  const hintBlack =
    "color-mix(in oklab, var(--color-primary) 55%, var(--color-ebony))";

  return (
    <svg
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      data-testid="keybed"
      className={cn(
        "block cursor-pointer touch-pan-y select-none [-webkit-touch-callout:none]",
        className
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onPointerLeave={onPointerEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      <KeybedRail width={geometry.width} height={geometry.feltHeight} />
      {geometry.whiteKeys.map((key) => {
        const note = lowNote + key.semitone;
        const down = held.has(note);
        const hinted = !down && hint.has(note);
        return (
          <g key={`w-${note}`} data-note={note}>
            <WhiteKeyShape
              k={key}
              lit={down || hinted}
              litColor={down ? "var(--color-primary)" : hintColor}
              pressed={down}
            />
          </g>
        );
      })}
      <g pointerEvents="none">
        {geometry.blackKeys.map((key) => (
          <BlackKeyShadowShape key={`s-${key.semitone}`} k={key} />
        ))}
      </g>
      {geometry.blackKeys.map((key) => {
        const note = lowNote + key.semitone;
        const down = held.has(note);
        const hinted = !down && hint.has(note);
        return (
          <g key={`b-${note}`} data-note={note}>
            <BlackKeyShape
              k={key}
              lit={down || hinted}
              litColor={down ? "var(--color-primary)" : hintBlack}
              pressed={down}
            />
          </g>
        );
      })}
    </svg>
  );
}

function noteAtPoint(x: number, y: number): { note: number; depth: number } | null {
  const element = document.elementFromPoint(x, y);
  const keyGroup = element?.closest?.("[data-note]");
  if (!keyGroup) return null;
  const note = Number(keyGroup.getAttribute("data-note"));
  if (!Number.isInteger(note)) return null;
  const rect = keyGroup.getBoundingClientRect();
  const depth = rect.height > 0 ? (y - rect.top) / rect.height : 0.5;
  return { note, depth };
}

/**
 * The landing page's stage edge, and a real instrument.
 *
 * Click, tap, or drag across the keys (a glissando works) and they play
 * through the shared audio host via `pressVirtualNote`, exactly like the
 * Workshop's on-screen keyboard. A connected MIDI keyboard lights the same
 * keys. The name board above the keys names whatever is held — "C4",
 * "Major 3rd", "Cmaj7" — and, after the first note, offers the QWERTY
 * piano (A W S E D…) so a visitor can keep going without a mouse.
 *
 * Purely an invitation: it is `aria-hidden` and never focusable, so it
 * adds nothing to the tab order or the accessibility tree.
 */
export function PlayableKeybed({ className }: { className?: string }) {
  const { heldNotes, connected } = useMidi();
  const pointerNotes = useRef(new Map<number, number | null>());
  const qwertyNotes = useRef(new Map<string, number>());
  const [played, setPlayed] = useState(false);
  const [lastNote, setLastNote] = useState<number | null>(null);

  const held = useMemo(() => new Set(heldNotes), [heldNotes]);
  const hint = useMemo(
    () => (played || connected ? new Set<number>() : new Set(IDLE_HINT)),
    [played, connected]
  );
  const readout = useMemo(() => nameHeldNotes(heldNotes), [heldNotes]);

  const desktop = useKeybedLayout(DESKTOP_RANGE);
  const phone = useKeybedLayout(PHONE_RANGE);
  const narrow = useIsNarrow();
  const glowAt =
    lastNote === null
      ? null
      : ((narrow ? phone : desktop).centreOf.get(lastNote) ?? null);

  const press = useCallback((note: number, velocity?: number) => {
    pressVirtualNote(note, velocity);
    setLastNote(note);
    setPlayed(true);
  }, []);

  const releaseIfUnused = useCallback((note: number | null | undefined) => {
    if (note === null || note === undefined) return;
    for (const other of pointerNotes.current.values()) {
      if (other === note) return;
    }
    for (const other of qwertyNotes.current.values()) {
      if (other === note) return;
    }
    releaseVirtualNote(note);
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      // Touch pointers are implicitly captured by the first key; release so
      // a finger sliding sideways can play the neighbouring keys.
      const target = event.target as Element;
      if (target.hasPointerCapture?.(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }
      const hit = noteAtPoint(event.clientX, event.clientY);
      if (!hit) return;
      event.preventDefault();
      pointerNotes.current.set(event.pointerId, hit.note);
      press(hit.note, velocityFromDepth(hit.depth));
    },
    [press]
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!pointerNotes.current.has(event.pointerId)) return;
      const previous = pointerNotes.current.get(event.pointerId) ?? null;
      const hit = noteAtPoint(event.clientX, event.clientY);
      const next = hit?.note ?? null;
      if (next === previous) return;
      pointerNotes.current.set(event.pointerId, next);
      releaseIfUnused(previous);
      if (next !== null && hit) press(next, velocityFromDepth(hit.depth));
    },
    [press, releaseIfUnused]
  );

  const onPointerEnd = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!pointerNotes.current.has(event.pointerId)) return;
      const previous = pointerNotes.current.get(event.pointerId);
      pointerNotes.current.delete(event.pointerId);
      releaseIfUnused(previous);
    },
    [releaseIfUnused]
  );

  // QWERTY piano, offered only once the visitor has played a note — the
  // landing page never claims the letter keys from someone just reading.
  useEffect(() => {
    if (!played) return;
    const heldKeys = qwertyNotes.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isEditableTarget(event.target)) return;
      const offset = QWERTY_OFFSETS.get(event.key.toLowerCase());
      if (offset === undefined || heldKeys.has(event.code)) return;
      const note = QWERTY_BASE_NOTE + offset;
      heldKeys.set(event.code, note);
      press(note);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const note = heldKeys.get(event.code);
      if (note === undefined) return;
      heldKeys.delete(event.code);
      releaseIfUnused(note);
    };
    const releaseAll = () => {
      heldKeys.clear();
      releaseAllVirtualNotes();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", releaseAll);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", releaseAll);
    };
  }, [played, press, releaseIfUnused]);

  // Leaving the page must never strand a sounding note.
  useEffect(() => () => releaseAllVirtualNotes(), []);

  const caption = connected
    ? "Your keyboard is connected — play anything."
    : played
      ? "Now try your computer keys: A W S E D F…"
      : "Go on — press a key.";

  return (
    <div aria-hidden className={cn("relative select-none", className)}>
      {/* Name board: the strip of wood above the keys, with a status lamp. */}
      <div className="relative flex h-9 items-center justify-between gap-4 overflow-hidden border-b border-ebony/60 px-4 text-xs sm:h-10 sm:px-5">
        {/* Light spilling up from the key you're holding; it follows a
            glissando and fades when you let go. */}
        {glowAt !== null ? (
          <span
            className="pointer-events-none absolute top-full h-16 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/45 blur-2xl transition-[left,opacity] duration-500 ease-out-quart motion-reduce:transition-none"
            style={{ left: `${glowAt * 100}%`, opacity: held.size > 0 ? 1 : 0 }}
          />
        ) : null}
        <span className="relative flex min-w-0 items-center gap-2.5 text-muted-foreground">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300",
              connected
                ? "bg-success shadow-[0_0_8px_1px_color-mix(in_oklab,var(--color-success)_70%,transparent)]"
                : held.size > 0
                  ? "bg-primary shadow-[0_0_8px_1px_var(--primary-glow)]"
                  : "bg-muted-foreground/40"
            )}
          />
          <span className="truncate font-heading text-[0.8rem] italic">{caption}</span>
        </span>
        <span className="relative flex min-w-0 items-baseline gap-2">
          {readout ? (
            <>
              <span className="font-heading text-sm font-semibold italic text-primary sm:text-base">
                {readout.symbol}
              </span>
              {readout.kind !== "note" ? (
                <span className="hidden font-mono text-[0.68rem] tracking-wide text-muted-foreground sm:inline">
                  {readout.notes.join(" · ")}
                </span>
              ) : null}
            </>
          ) : (
            <span className="font-mono text-[0.68rem] tracking-wide text-muted-foreground/70">
              {played ? " " : "Cmaj7 · C E G B"}
            </span>
          )}
        </span>
      </div>

      <KeybedSvg
        {...DESKTOP_RANGE}
        held={held}
        hint={hint}
        className="hidden h-[clamp(4.5rem,11svh,7rem)] w-full sm:block"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerEnd={onPointerEnd}
      />
      <KeybedSvg
        {...PHONE_RANGE}
        held={held}
        hint={hint}
        className="h-[clamp(5rem,12svh,6.5rem)] w-full sm:hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerEnd={onPointerEnd}
      />
    </div>
  );
}
