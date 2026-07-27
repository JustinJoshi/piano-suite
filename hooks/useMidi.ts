"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MidiInputInfo = {
  id: string;
  name: string;
};

export type MidiNoteEventDetail = {
  note: number;
  pc: number;
};

/**
 * React hook for Web MIDI input.
 *
 * Manages device enumeration, selected input, and held-note state.
 * Dispatches `midi-note-on` and `midi-note-off` custom events on `window`
 * so non-React consumers (or sibling tabs) can share the same connection.
 */
export function useMidi() {
  // Start with a server-safe default and detect support after hydration to
  // avoid a mismatch between the server-rendered HTML and the client render.
  const [supported, setSupported] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [inputs, setInputs] = useState<MidiInputInfo[]>([]);
  const [selectedInputId, setSelectedInputIdState] = useState<string | null>(null);
  const [heldNotes, setHeldNotes] = useState<number[]>([]);
  const [heldPcs, setHeldPcs] = useState<Set<number>>(new Set());

  const accessRef = useRef<MIDIAccess | null>(null);
  const heldSetRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const isMidiSupported =
      typeof navigator !== "undefined" && "requestMIDIAccess" in navigator;
    setSupported(isMidiSupported);
    if (!isMidiSupported) {
      setError("Web MIDI is not supported in this browser.");
    }
  }, []);

  const updateHeldState = useCallback(() => {
    const sorted = [...heldSetRef.current].sort((a, b) => a - b);
    setHeldNotes(sorted);
    setHeldPcs(new Set(sorted.map((n) => ((n % 12) + 12) % 12)));
  }, []);

  const handleMidiMessage = useCallback(
    (event: MIDIMessageEvent) => {
      const [status, note, velocity] = event.data as Uint8Array & number[];
      const command = status & 0xf0;
      const isNoteOn = command === 0x90 && velocity > 0;
      const isNoteOff = command === 0x80 || (command === 0x90 && velocity === 0);

      if (isNoteOn) {
        heldSetRef.current.add(note);
        window.dispatchEvent(
          new CustomEvent<MidiNoteEventDetail>("midi-note-on", {
            detail: { note, pc: ((note % 12) + 12) % 12 },
          })
        );
      } else if (isNoteOff) {
        heldSetRef.current.delete(note);
        window.dispatchEvent(
          new CustomEvent<MidiNoteEventDetail>("midi-note-off", {
            detail: { note, pc: ((note % 12) + 12) % 12 },
          })
        );
      } else {
        return;
      }

      updateHeldState();
    },
    [updateHeldState]
  );

  const refreshInputs = useCallback((access: MIDIAccess) => {
    const list: MidiInputInfo[] = [];
    access.inputs.forEach((input) => {
      list.push({ id: input.id, name: input.name || "MIDI Device" });
    });

    setInputs(list);
    setSelectedInputIdState((prev) => prev ?? (list[0]?.id ?? null));
  }, []);

  const attachHandler = useCallback(() => {
    const access = accessRef.current;
    if (!access || !selectedInputId) return;

    access.inputs.forEach((input) => {
      input.onmidimessage = null;
    });

    const input = access.inputs.get(selectedInputId);
    if (input) {
      input.onmidimessage = handleMidiMessage;
    }
  }, [selectedInputId, handleMidiMessage]);

  const setSelectedInputId = useCallback((id: string) => {
    setSelectedInputIdState(id);
  }, []);

  const connect = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      setSupported(false);
      setError("Web MIDI is not supported in this browser.");
      return;
    }

    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      accessRef.current = access;
      refreshInputs(access);
      setConnected(true);
      setError(null);

      access.onstatechange = () => {
        refreshInputs(access);
      };
    } catch {
      setSupported(false);
      setError("Could not access MIDI devices.");
    }
  }, [refreshInputs]);

  // Attach or reattach the MIDI message handler whenever the selected input
  // changes or a new access object becomes available.
  useEffect(() => {
    attachHandler();

    return () => {
      const access = accessRef.current;
      if (access) {
        access.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
      }
    };
  }, [attachHandler]);

  // Clean up held notes on unmount.
  useEffect(() => {
    const heldSet = heldSetRef.current;
    return () => {
      heldSet.clear();
    };
  }, []);

  return {
    supported,
    connected,
    inputs,
    selectedInputId,
    setSelectedInputId,
    heldNotes,
    heldPcs,
    connect,
    error,
  };
}
