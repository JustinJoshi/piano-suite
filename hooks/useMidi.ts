"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  connectMidiSession,
  getMidiSessionSnapshot,
  getServerMidiSessionSnapshot,
  setMidiSelectedInputId,
  subscribeMidiSession,
  type MidiInputInfo,
  type MidiNoteEventDetail,
  type MidiSessionSnapshot,
} from "@/lib/midi-session";

export type { MidiInputInfo, MidiNoteEventDetail, MidiSessionSnapshot };

/**
 * React hook for Web MIDI input.
 *
 * Subscribes to the tab-scoped MIDI session in `lib/midi-session.ts` so the
 * connection, selected device, and held notes survive tool-page navigation.
 * Dispatches `midi-note-on` / `midi-note-off` custom events on `window` from
 * the session store (not per-page).
 */
export function useMidi() {
  const state = useSyncExternalStore(
    subscribeMidiSession,
    getMidiSessionSnapshot,
    getServerMidiSessionSnapshot
  );

  const setSelectedInputId = useCallback((id: string) => {
    setMidiSelectedInputId(id);
  }, []);

  const connect = useCallback(async () => {
    await connectMidiSession();
  }, []);

  // Stable across renders that do not change held notes (avoids effect thrash).
  const heldPcs = useMemo(
    () => new Set(state.heldNotes.map((n) => ((n % 12) + 12) % 12)),
    [state.heldNotes]
  );

  return {
    supported: state.supported,
    connected: state.connected,
    inputs: state.inputs,
    selectedInputId: state.selectedInputId,
    setSelectedInputId,
    heldNotes: state.heldNotes,
    heldPcs,
    connect,
    error: state.error,
  };
}
