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
  const { settings } = useAudioSettings();
  const { connected } = useMidi();

  const engineRef = useRef<AudioEngine | null>(null);
  const settingsRef = useRef(settings);
  const connectedRef = useRef(connected);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  // Create a new engine whenever the instrument preset changes.
  // Volume is applied separately so we don't reload samples on every slide.
  useEffect(() => {
    const engine = createAudioEngine(settings.preset, settings.volume);
    engineRef.current = engine;

    // Start loading samples eagerly so the first note plays quickly.
    engine.load().catch(() => {
      // Loading errors are surfaced through engine.state if we ever expose it.
    });

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.preset]);

  // Update volume without recreating the engine.
  useEffect(() => {
    engineRef.current?.setVolume(settings.volume);
  }, [settings.volume]);

  // Stop all notes when the user disables the feature.
  useEffect(() => {
    if (!settings.enabled) {
      engineRef.current?.stopAll();
    }
  }, [settings.enabled]);

  // Subscribe to global MIDI note events.
  useEffect(() => {
    const onNoteOn = (event: Event) => {
      if (!settingsRef.current.enabled || !connectedRef.current) return;
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;
      engineRef.current?.play(detail.note, detail.velocity);
    };

    const onNoteOff = (event: Event) => {
      if (!settingsRef.current.enabled || !connectedRef.current) return;
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;
      engineRef.current?.stop(detail.note);
    };

    window.addEventListener("midi-note-on", onNoteOn);
    window.addEventListener("midi-note-off", onNoteOff);

    return () => {
      window.removeEventListener("midi-note-on", onNoteOn);
      window.removeEventListener("midi-note-off", onNoteOff);
    };
  }, []);

  return null;
}
