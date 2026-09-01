"use client";

import { useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useMidi } from "@/hooks/useMidi";
import {
  pressVirtualNote,
  releaseAllVirtualNotes,
  releaseVirtualNote,
} from "@/lib/midi-session";
import {
  buildKeyboardLayout,
  computerKeyForOffset,
} from "@/lib/feature-blocks/keyboard-display/keys";
import type { KeyboardDisplayConfig } from "@/lib/feature-blocks/keyboard-display/config";

const KEY_COUNT_PER_OCTAVE = 12;
/** Black key width relative to one white key, as a fraction. */
const BLACK_KEY_WIDTH = 0.62;
const CHROMATIC_KEYCAP_COUNT = 18;
const EDITABLE_TAGS = new Set(["input", "textarea", "select"]);

/** Computer-key cap → chromatic offset from the lowest key. */
const CHROMATIC_OFFSETS: ReadonlyMap<string, number> = (() => {
  const offsets = new Map<string, number>();
  for (let offset = 0; offset < CHROMATIC_KEYCAP_COUNT; offset += 1) {
    const cap = computerKeyForOffset(offset);
    if (cap) offsets.set(cap, offset);
  }
  return offsets;
})();

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (EDITABLE_TAGS.has(target.tagName.toLowerCase()) ||
      target.isContentEditable)
  );
}

/**
 * On-screen piano: click, touch, or type (A W S E D…) to play.
 *
 * Notes are injected into the shared MIDI session (`pressVirtualNote`), so
 * drills score them, visualizations react to them, and the audio host plays
 * them exactly like hardware input. This is what lets "Play now" work for
 * visitors with no MIDI controller.
 */
export function KeyboardDisplayBlock(config: KeyboardDisplayConfig) {
  const { heldNotes } = useMidi();

  const layout = useMemo(
    () =>
      buildKeyboardLayout(
        config.lowNote,
        config.octaves * KEY_COUNT_PER_OCTAVE
      ),
    [config.lowNote, config.octaves]
  );

  const heldSet = useMemo(() => new Set(heldNotes), [heldNotes]);

  // Computer-keyboard playing: chromatic mapping from the lowest key.
  const { lowNote, computerKeys } = config;
  useEffect(() => {
    if (!computerKeys) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isEditableTarget(event.target)) return;

      const offset = CHROMATIC_OFFSETS.get(event.key.toLowerCase());
      if (offset === undefined) return;

      event.preventDefault();
      pressVirtualNote(lowNote + offset, 90);
    }

    function onKeyUp(event: KeyboardEvent) {
      const offset = CHROMATIC_OFFSETS.get(event.key.toLowerCase());
      if (offset === undefined) return;
      releaseVirtualNote(lowNote + offset);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      releaseAllVirtualNotes();
    };
  }, [computerKeys, lowNote]);

  return (
    <div className="space-y-3" data-testid="keyboard-display-block">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          On-screen keyboard
        </span>
        {computerKeys && (
          <span className="text-xs text-muted-foreground">
            Type A W S E D F… to play
          </span>
        )}
      </div>

      <div
        className="relative flex h-36 w-full touch-none select-none sm:h-40"
        data-testid="keyboard-display"
      >
        {layout.whiteKeys.map((key) => (
          <button
            key={key.note}
            type="button"
            aria-label={`${key.name} key`}
            onPointerDown={() => pressVirtualNote(key.note, 90)}
            onPointerUp={() => releaseVirtualNote(key.note)}
            onPointerLeave={() => releaseVirtualNote(key.note)}
            onPointerCancel={() => releaseVirtualNote(key.note)}
            onContextMenu={(event) => event.preventDefault()}
            className={cn(
              "relative z-0 min-w-0 flex-1 rounded-b-md border border-border bg-card transition-colors",
              "hover:bg-muted/60",
              heldSet.has(key.note) && "border-primary/50 bg-primary/20"
            )}
          >
            {config.showNoteNames && (
              <span className="pointer-events-none absolute inset-x-0 bottom-1.5 text-center text-[10px] font-medium text-muted-foreground">
                {key.name}
                {computerKeys && key.keyCap && (
                  <span className="ml-1 text-muted-foreground/60">
                    {key.keyCap.toUpperCase()}
                  </span>
                )}
              </span>
            )}
          </button>
        ))}

        {layout.blackKeys.map((key) => {
          const widthPercent =
            (BLACK_KEY_WIDTH / layout.whiteKeys.length) * 100;
          return (
            <button
              key={key.note}
              type="button"
              aria-label={`${key.name} key`}
              onPointerDown={() => pressVirtualNote(key.note, 90)}
              onPointerUp={() => releaseVirtualNote(key.note)}
              onPointerLeave={() => releaseVirtualNote(key.note)}
              onPointerCancel={() => releaseVirtualNote(key.note)}
              onContextMenu={(event) => event.preventDefault()}
              style={{
                left: `${key.leftFraction * 100}%`,
                width: `${widthPercent}%`,
              }}
              className={cn(
                "absolute top-0 z-10 h-3/5 -translate-x-1/2 rounded-b-md border border-border bg-foreground/90 transition-colors",
                "hover:bg-foreground/70",
                heldSet.has(key.note) && "border-primary bg-primary"
              )}
            >
              {computerKeys && key.keyCap && (
                <span className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-[9px] font-medium text-background/70">
                  {key.keyCap.toUpperCase()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
