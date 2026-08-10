"use client";

import { useEffect, useRef } from "react";
import { useAudioSettings } from "@/hooks/useAudioSettings";
import { useMidi, type MidiNoteEventDetail } from "@/hooks/useMidi";
import { createAudioEngine, type AudioEngine } from "@/lib/audio-engine";

/**
 * Global MIDI-to-audio host.
 *
 * Mounted once in the root layout. Listens to tab-scoped MIDI note events and
 * routes them through the active smplr-based piano sound when the user has the
 * feature enabled and a MIDI device is connected.
 */
export function AudioEngineHost() {
  const { settings, setEngineState } = useAudioSettings();
  const { connected } = useMidi();

  const engineRef = useRef<AudioEngine | null>(null);
  const settingsRef = useRef(settings);
  const connectedRef = useRef(connected);
  const sustainedNotesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  // Create a new engine whenever the instrument preset or custom kit changes.
  // Volume is applied separately so we don't reload samples on every slide.
  useEffect(() => {
    const engine = createAudioEngine(
      settings.preset,
      settings.volume,
      settings.customKit,
      {
        onStateChange: setEngineState,
      }
    );
    const sustainedNotes = sustainedNotesRef.current;
    engineRef.current = engine;
    sustainedNotes.clear();

    // Start loading samples eagerly so the first note plays quickly.
    engine.load().catch(() => {
      // Loading errors are surfaced through onStateChange.
    });

    return () => {
      engine.dispose();
      engineRef.current = null;
      sustainedNotes.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.preset, settings.customKit]);

  // Update volume without recreating the engine.
  useEffect(() => {
    engineRef.current?.setVolume(settings.volume);
  }, [settings.volume]);

  // Stop all notes when the user disables the feature.
  useEffect(() => {
    if (!settings.enabled) {
      engineRef.current?.stopAll();
      sustainedNotesRef.current.clear();
    }
  }, [settings.enabled]);

  // Release sustained notes when sustain is turned off.
  useEffect(() => {
    if (!settings.sustain) {
      sustainedNotesRef.current.forEach((note) => {
        engineRef.current?.stop(note);
      });
      sustainedNotesRef.current.clear();
    }
  }, [settings.sustain]);

  // Subscribe to global MIDI note events.
  useEffect(() => {
    const onNoteOn = (event: Event) => {
      if (!settingsRef.current.enabled || !connectedRef.current) return;
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;
      sustainedNotesRef.current.delete(detail.note);
      engineRef.current?.play(detail.note, detail.velocity);
    };

    const onNoteOff = (event: Event) => {
      if (!settingsRef.current.enabled || !connectedRef.current) return;
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;

      if (settingsRef.current.sustain) {
        sustainedNotesRef.current.add(detail.note);
        return;
      }

      engineRef.current?.stop(detail.note);
    };

    const onMusicNoteOn = (event: Event) => {
      if (!settingsRef.current.enabled) return;
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;
      engineRef.current?.play(detail.note, detail.velocity);
    };

    const onMusicNoteOff = (event: Event) => {
      if (!settingsRef.current.enabled) return;
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;
      engineRef.current?.stop(detail.note);
    };

    window.addEventListener("midi-note-on", onNoteOn);
    window.addEventListener("midi-note-off", onNoteOff);
    window.addEventListener("music-note-on", onMusicNoteOn);
    window.addEventListener("music-note-off", onMusicNoteOff);

    return () => {
      window.removeEventListener("midi-note-on", onNoteOn);
      window.removeEventListener("midi-note-off", onNoteOff);
      window.removeEventListener("music-note-on", onMusicNoteOn);
      window.removeEventListener("music-note-off", onMusicNoteOff);
    };
  }, []);

  return null;
}
