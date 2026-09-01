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
  const { connected, virtualActive } = useMidi();

  const engineRef = useRef<AudioEngine | null>(null);
  const settingsRef = useRef(settings);
  const inputActiveRef = useRef(connected || virtualActive);
  const sustainedNotesRef = useRef<Set<number>>(new Set());
  const musicActiveNotesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Sound needs a live note source: a connected MIDI device or held
  // on-screen keyboard notes.
  useEffect(() => {
    inputActiveRef.current = connected || virtualActive;
  }, [connected, virtualActive]);

  // Create a new engine whenever the instrument preset or custom kit changes.
  // Volume is applied separately so we don't reload samples on every slide.
  // No engine (and no sample downloads) while both sound toggles are off;
  // the same engine also plays music-player notes (musicEnabled).
  useEffect(() => {
    if (!settings.enabled && !settings.musicEnabled) {
      return;
    }

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
  }, [settings.preset, settings.customKit, settings.enabled, settings.musicEnabled]);

  // Update volume without recreating the engine.
  useEffect(() => {
    engineRef.current?.setVolume(settings.volume);
  }, [settings.volume]);

  // Autoplay policy: Web Audio only resumes from a real user gesture, and
  // MIDI events don't count. Resume the shared context on the first
  // pointerdown/keydown so notes played before any click are not lost.
  useEffect(() => {
    const resume = () => {
      engineRef.current?.resumeFromUserGesture();
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
  }, []);

  // Stop all notes when the user disables the feature.
  useEffect(() => {
    if (!settings.enabled) {
      engineRef.current?.stopAll();
      sustainedNotesRef.current.clear();
    }
  }, [settings.enabled]);

  // Stop music-player notes when music audio is turned off.
  useEffect(() => {
    if (!settings.musicEnabled) {
      musicActiveNotesRef.current.forEach((note) => {
        engineRef.current?.stop(note);
      });
      musicActiveNotesRef.current.clear();
    }
  }, [settings.musicEnabled]);

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
      if (!settingsRef.current.enabled || !inputActiveRef.current) return;
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;
      sustainedNotesRef.current.delete(detail.note);
      engineRef.current?.play(detail.note, detail.velocity);
    };

    const onNoteOff = (event: Event) => {
      if (!settingsRef.current.enabled || !inputActiveRef.current) return;
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;

      if (settingsRef.current.sustain) {
        sustainedNotesRef.current.add(detail.note);
        return;
      }

      engineRef.current?.stop(detail.note);
    };

    const onMusicNoteOn = (event: Event) => {
      if (!settingsRef.current.musicEnabled) return;
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;
      musicActiveNotesRef.current.add(detail.note);
      engineRef.current?.play(detail.note, detail.velocity);
    };

    const onMusicNoteOff = (event: Event) => {
      if (!settingsRef.current.musicEnabled) return;
      const detail = (event as CustomEvent<MidiNoteEventDetail>).detail;
      if (!detail) return;
      musicActiveNotesRef.current.delete(detail.note);
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
