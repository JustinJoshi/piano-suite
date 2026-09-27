/**
 * Tab-scoped Web MIDI session store.
 *
 * Survives App Router page remounts so Connect once keeps working across tools.
 * React hooks subscribe via `subscribeMidiSession` / `getMidiSessionSnapshot`.
 */

export type MidiInputInfo = {
  id: string;
  name: string;
};

export type MidiNoteEventDetail = {
  note: number;
  pc: number;
  /** MIDI velocity 0–127. Present on note-on; 0 on note-off. */
  velocity: number;
};

export type MidiSessionSnapshot = {
  supported: boolean;
  connected: boolean;
  error: string | null;
  inputs: MidiInputInfo[];
  selectedInputId: string | null;
  heldNotes: number[];
  /** True while on-screen keyboard notes are held (even over a hardware pitch). */
  virtualActive: boolean;
};

const STORAGE_KEY = "piano-suite-midi-v1";

type PersistedMidiSession = {
  connected: true;
  selectedInputId: string | null;
};

type Listener = () => void;

const listeners = new Set<Listener>();
/** Notes held by the selected hardware input. */
const hardwareSet = new Set<number>();
/** Notes held via the on-screen keyboard. */
const virtualSet = new Set<number>();

let access: MIDIAccess | null = null;
let connectPromise: Promise<void> | null = null;
let restoreStarted = false;
let preferredInputId: string | null = null;

let snapshot: MidiSessionSnapshot = {
  supported: false,
  connected: false,
  error: null,
  inputs: [],
  selectedInputId: null,
  heldNotes: [],
  virtualActive: false,
};

function detectSupported(): boolean {
  return typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
}

/** Held by either source, sorted — hardware and virtual may share a pitch. */
function unionHeldNotes(): number[] {
  return [...new Set([...hardwareSet, ...virtualSet])].sort((a, b) => a - b);
}

function emit(): void {
  snapshot = {
    supported: snapshot.supported,
    connected: snapshot.connected,
    error: snapshot.error,
    inputs: snapshot.inputs,
    selectedInputId: snapshot.selectedInputId,
    heldNotes: unionHeldNotes(),
    virtualActive: virtualSet.size > 0,
  };
  for (const listener of listeners) {
    listener();
  }
}

function setSnapshot(partial: Partial<MidiSessionSnapshot>): void {
  snapshot = {
    ...snapshot,
    ...partial,
    heldNotes:
      partial.heldNotes !== undefined
        ? partial.heldNotes
        : unionHeldNotes(),
  };
  for (const listener of listeners) {
    listener();
  }
}

function readPersisted(): PersistedMidiSession | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "connected" in parsed &&
      (parsed as PersistedMidiSession).connected === true
    ) {
      const selected =
        "selectedInputId" in parsed &&
        (typeof (parsed as PersistedMidiSession).selectedInputId === "string" ||
          (parsed as PersistedMidiSession).selectedInputId === null)
          ? (parsed as PersistedMidiSession).selectedInputId
          : null;
      return { connected: true, selectedInputId: selected };
    }
  } catch {
    // Ignore corrupt sessionStorage.
  }
  return null;
}

function persistSession(): void {
  if (typeof sessionStorage === "undefined") return;
  if (!snapshot.connected) return;
  const payload: PersistedMidiSession = {
    connected: true,
    selectedInputId: snapshot.selectedInputId,
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota / private mode — ignore.
  }
}

function clearPersisted(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

function dispatchNoteOff(note: number): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<MidiNoteEventDetail>("midi-note-off", {
      detail: {
        note,
        pc: ((note % 12) + 12) % 12,
        velocity: 0,
      },
    })
  );
}

/**
 * Drop hardware ownership (input switch / disconnect). Pitches the
 * on-screen keyboard still holds keep sounding; everything else gets its
 * note-off, because the device will never send the matching release.
 */
function dropHardwareNotes(): void {
  for (const note of hardwareSet) {
    if (!virtualSet.has(note)) {
      dispatchNoteOff(note);
    }
  }
  hardwareSet.clear();
}

function handleMidiMessage(event: MIDIMessageEvent): void {
  const data = event.data;
  if (!data || data.length < 3) return;

  const status = data[0]!;
  const note = data[1]!;
  const velocity = data[2]!;
  const command = status & 0xf0;
  const isNoteOn = command === 0x90 && velocity > 0;
  const isNoteOff = command === 0x80 || (command === 0x90 && velocity === 0);

  if (isNoteOn) {
    // Hardware retriggers: devices send repeated note-ons, and each one
    // re-attacks. Ownership is still a set, so heldNotes keeps one entry.
    hardwareSet.add(note);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent<MidiNoteEventDetail>("midi-note-on", {
          detail: {
            note,
            pc: ((note % 12) + 12) % 12,
            velocity,
          },
        })
      );
    }
  } else if (isNoteOff) {
    // Only the final owner's release stops the sounding note.
    const owned = hardwareSet.delete(note);
    if (owned && !virtualSet.has(note)) {
      dispatchNoteOff(note);
    }
  } else {
    return;
  }

  emit();
}

function attachHandler(): void {
  if (!access || !snapshot.selectedInputId) return;

  access.inputs.forEach((input) => {
    input.onmidimessage = null;
  });

  const input = access.inputs.get(snapshot.selectedInputId);
  if (input) {
    input.onmidimessage = handleMidiMessage;
  }
}

function refreshInputs(midiAccess: MIDIAccess): void {
  const list: MidiInputInfo[] = [];
  midiAccess.inputs.forEach((input) => {
    list.push({ id: input.id, name: input.name || "MIDI Device" });
  });

  const preferred =
    preferredInputId ?? snapshot.selectedInputId ?? list[0]?.id ?? null;
  const nextSelected =
    preferred && list.some((input) => input.id === preferred)
      ? preferred
      : (list[0]?.id ?? null);

  setSnapshot({
    inputs: list,
    selectedInputId: nextSelected,
  });
  attachHandler();
  persistSession();
}

async function doConnect(): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
    setSnapshot({
      supported: false,
      connected: false,
      error: "Web MIDI is not supported in this browser.",
    });
    clearPersisted();
    return;
  }

  if (access && snapshot.connected) {
    refreshInputs(access);
    return;
  }

  try {
    const midiAccess = await navigator.requestMIDIAccess({ sysex: false });
    access = midiAccess;
    setSnapshot({
      supported: true,
      connected: true,
      error: null,
    });
    refreshInputs(midiAccess);
    midiAccess.onstatechange = () => {
      if (access) {
        // A disconnected input never sends its pending note-offs; drop its
        // notes so drills don't see them stuck forever.
        if (
          snapshot.selectedInputId !== null &&
          !access.inputs.get(snapshot.selectedInputId)
        ) {
          dropHardwareNotes();
        }
        refreshInputs(access);
      }
    };
    persistSession();
  } catch {
    access = null;
    // Reaching here means requestMIDIAccess exists, so the browser supports
    // Web MIDI — the user (or browser policy) denied permission. Keep
    // `supported: true` so the UI can offer a retry instead of dead-ending.
    dropHardwareNotes();
    setSnapshot({
      supported: true,
      connected: false,
      error:
        "MIDI access was denied — allow it in the browser site settings and retry.",
      inputs: [],
      selectedInputId: null,
    });
    clearPersisted();
  }
}

/**
 * Request (or reuse) Web MIDI access for this tab session.
 * Idempotent: safe to call from multiple mounts / restore paths.
 */
export async function connectMidiSession(): Promise<void> {
  ensureMidiSupportDetected();

  if (connectPromise) {
    await connectPromise;
    return;
  }

  connectPromise = doConnect().finally(() => {
    connectPromise = null;
  });
  await connectPromise;
}

export function setMidiSelectedInputId(id: string): void {
  preferredInputId = id;
  // Switching inputs detaches the old handler, so its held notes would be
  // stuck forever — release them now, keeping on-screen notes alive.
  if (snapshot.selectedInputId !== id) {
    dropHardwareNotes();
  }
  setSnapshot({ selectedInputId: id });
  attachHandler();
  persistSession();
}

/**
 * On-screen keyboard: press a note without MIDI hardware.
 *
 * Virtual notes flow through the same session store as hardware notes —
 * held notes, `midi-note-on`/`midi-note-off` window events — so every drill,
 * scorer, and the audio host treats them identically.
 */
export function pressVirtualNote(note: number, velocity = 80): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(note) || note < 0 || note > 127) return;

  // Idempotent: a second press of an already-held virtual note does not
  // re-attack. Ownership is recorded even when hardware already holds the
  // pitch, so `virtualActive` reflects the on-screen keyboard truthfully.
  const alreadySounding = hardwareSet.has(note) || virtualSet.has(note);
  virtualSet.add(note);

  if (!alreadySounding) {
    window.dispatchEvent(
      new CustomEvent<MidiNoteEventDetail>("midi-note-on", {
        detail: {
          note,
          pc: ((note % 12) + 12) % 12,
          velocity,
        },
      })
    );
  }

  emit();
}

/** On-screen keyboard: release a note pressed via `pressVirtualNote`. */
export function releaseVirtualNote(note: number): void {
  if (typeof window === "undefined") return;

  // Only the virtual owner may release here; an unmatched release must not
  // silence a hardware-held pitch.
  const owned = virtualSet.delete(note);
  if (owned && !hardwareSet.has(note)) {
    dispatchNoteOff(note);
  }

  emit();
}

/** Release every on-screen note at once (e.g. on unmount / lost focus). */
export function releaseAllVirtualNotes(): void {
  if (typeof window === "undefined") return;

  for (const note of virtualSet) {
    if (!hardwareSet.has(note)) {
      dispatchNoteOff(note);
    }
  }
  virtualSet.clear();

  emit();
}

export function getMidiSessionSnapshot(): MidiSessionSnapshot {
  return snapshot;
}

const SERVER_MIDI_SESSION_SNAPSHOT: MidiSessionSnapshot = {
  supported: false,
  connected: false,
  error: null,
  inputs: [],
  selectedInputId: null,
  heldNotes: [],
  virtualActive: false,
};

export function getServerMidiSessionSnapshot(): MidiSessionSnapshot {
  return SERVER_MIDI_SESSION_SNAPSHOT;
}

export function subscribeMidiSession(listener: Listener): () => void {
  listeners.add(listener);
  ensureMidiSupportDetected();
  void ensureMidiSessionRestored();
  return () => {
    listeners.delete(listener);
  };
}

function ensureMidiSupportDetected(): void {
  if (typeof window === "undefined") return;
  const supported = detectSupported();
  if (!supported) {
    if (snapshot.supported || snapshot.error !== "Web MIDI is not supported in this browser.") {
      setSnapshot({
        supported: false,
        error: "Web MIDI is not supported in this browser.",
      });
    }
    return;
  }
  if (!snapshot.supported) {
    setSnapshot({
      supported: true,
      error: snapshot.connected ? null : snapshot.error,
    });
  }
}

/**
 * If this tab previously connected MIDI, silently reconnect after remount/reload.
 * Does not prompt on a cold first visit.
 */
export async function ensureMidiSessionRestored(): Promise<void> {
  if (typeof window === "undefined") return;
  ensureMidiSupportDetected();
  if (restoreStarted || snapshot.connected) return;

  const persisted = readPersisted();
  if (!persisted) return;

  restoreStarted = true;
  preferredInputId = persisted.selectedInputId;
  await connectMidiSession();
}

/** Test-only: reset module state between Vitest cases. */
export function __resetMidiSessionForTests(): void {
  if (access) {
    access.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
    access.onstatechange = null;
  }
  access = null;
  connectPromise = null;
  restoreStarted = false;
  preferredInputId = null;
  hardwareSet.clear();
  virtualSet.clear();
  listeners.clear();
  snapshot = {
    supported: detectSupported(),
    connected: false,
    error: detectSupported() ? null : "Web MIDI is not supported in this browser.",
    inputs: [],
    selectedInputId: null,
    heldNotes: [],
    virtualActive: false,
  };
  clearPersisted();
}
