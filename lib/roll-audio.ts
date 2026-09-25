/**
 * The roll's note channel.
 *
 * Everything on a roll page that makes a note without a key being pressed —
 * holes passing the tracker bar, "Hear it", the flashcard, the block motifs —
 * goes through here. Notes are ref-counted per pitch across sources, so two
 * passages sounding the same pitch start it once and stop it once.
 *
 * An audible note is dispatched as `music-note-on` / `music-note-off`, which
 * `AudioEngineHost` already plays. A silent one (sound off, or the page is
 * being skimmed) is dispatched as `roll-note-on` / `roll-note-off`, which only
 * lights the tracker bar. Keys the visitor presses go through
 * `pressVirtualNote` instead, like every other drill.
 */

import { dispatchMusicNoteOff, dispatchMusicNoteOn } from "@/lib/music-player";

export const ROLL_NOTE_ON = "roll-note-on";
export const ROLL_NOTE_OFF = "roll-note-off";

type Channel = "music" | "light";

const sounding = new Map<number, { count: number; channel: Channel }>();
const holders = new Set<string>();

function dispatchLight(note: number, on: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(on ? ROLL_NOTE_ON : ROLL_NOTE_OFF, {
      detail: { note, pc: ((note % 12) + 12) % 12, velocity: 0 },
    })
  );
}

export function rollNoteOn(
  note: number,
  source: string,
  { velocity = 0.62, audible = true }: { velocity?: number; audible?: boolean } = {}
): void {
  const key = `${source}|${note}`;
  if (holders.has(key)) return;
  holders.add(key);
  const entry = sounding.get(note);
  if (entry) {
    entry.count += 1;
    return;
  }
  const channel: Channel = audible ? "music" : "light";
  sounding.set(note, { count: 1, channel });
  if (channel === "music") dispatchMusicNoteOn(note, velocity * 127);
  else dispatchLight(note, true);
}

export function rollNoteOff(note: number, source: string): void {
  if (!holders.delete(`${source}|${note}`)) return;
  const entry = sounding.get(note);
  if (!entry) return;
  entry.count -= 1;
  if (entry.count > 0) return;
  sounding.delete(note);
  if (entry.channel === "music") dispatchMusicNoteOff(note);
  else dispatchLight(note, false);
}

/** Let go of every note a source (or every source with this prefix) holds. */
export function releaseRollSource(prefix: string): void {
  for (const key of [...holders]) {
    const cut = key.lastIndexOf("|");
    if (key.slice(0, cut).startsWith(prefix)) rollNoteOff(Number(key.slice(cut + 1)), key.slice(0, cut));
  }
}

/** Test hook. */
export function __resetRollAudioForTests(): void {
  sounding.clear();
  holders.clear();
}

export type RollSequenceNote = { p: number | "tick"; t: number; d?: number; v?: number; accent?: boolean };

/**
 * Play notes (t and d in beats) at a tempo through the roll channel. Ticks
 * are handed to `onTick`. Returns stop(); `onDone` fires either way.
 */
export function playRollSequence(
  notes: RollSequenceNote[],
  {
    bpm = 100,
    source,
    audible = true,
    onStart,
    onEnd,
    onTick,
    onDone,
  }: {
    bpm?: number;
    source: string;
    audible?: boolean;
    onStart?: (index: number) => void;
    onEnd?: (index: number) => void;
    onTick?: (accent: boolean) => void;
    onDone?: () => void;
  }
): () => void {
  const msPerBeat = 60000 / bpm;
  const timers: ReturnType<typeof setTimeout>[] = [];
  const live = new Set<number>();
  let stopped = false;

  notes.forEach((n, i) => {
    timers.push(
      setTimeout(() => {
        if (stopped) return;
        if (n.p === "tick") {
          onTick?.(Boolean(n.accent));
          onStart?.(i);
          timers.push(setTimeout(() => onEnd?.(i), 90));
          return;
        }
        rollNoteOn(n.p, `${source}:${i}`, { velocity: n.v ?? 0.62, audible });
        live.add(i);
        onStart?.(i);
      }, n.t * msPerBeat)
    );
    if (n.p !== "tick") {
      const pitch = n.p;
      timers.push(
        setTimeout(() => {
          if (stopped) return;
          rollNoteOff(pitch, `${source}:${i}`);
          live.delete(i);
          onEnd?.(i);
        }, (n.t + (n.d ?? 0.25)) * msPerBeat)
      );
    }
  });

  const total = Math.max(0, ...notes.map((n) => n.t + (n.d ?? 0.25)));
  timers.push(
    setTimeout(() => {
      if (stopped) return;
      stopped = true;
      onDone?.();
    }, total * msPerBeat + 60)
  );

  return () => {
    if (stopped) return;
    stopped = true;
    timers.forEach(clearTimeout);
    for (const i of live) {
      const pitch = notes[i].p;
      if (typeof pitch === "number") rollNoteOff(pitch, `${source}:${i}`);
      onEnd?.(i);
    }
    live.clear();
    onDone?.();
  };
}
