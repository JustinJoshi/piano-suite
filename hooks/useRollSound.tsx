"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAudioSettings } from "@/hooks/useAudioSettings";
import { playRollSequence } from "@/lib/roll-audio";

/**
 * Whether the roll plays as it scrolls past the tracker bar.
 *
 * Page-scoped and off by default: scrolling should never make noise unless
 * the visitor asked for it. It turns on when they press "Sound", or the first
 * time they play a key on the page (they are clearly making sound already) —
 * unless they have switched it off themselves, which is then respected for
 * the rest of the visit. Output still goes through `AudioEngineHost`, so the
 * visitor's instrument and volume apply.
 */

type RollSoundContextValue = {
  on: boolean;
  userMuted: boolean;
  /** The Sound toggle. */
  toggle: () => void;
  /** An explicit gesture that wants sound (a key, "Hear it"). Returns whether sound is on. */
  want: () => boolean;
  /** The tracker's one-line note, empty when nothing needs saying. */
  message: string;
};

const RollSoundContext = createContext<RollSoundContextValue | null>(null);

const FIRST_ON_MESSAGE =
  "Sound is on. The roll plays whatever passes under this bar, so scroll slowly to hear it.";

export function RollSoundProvider({ children }: { children: ReactNode }) {
  const { settings, setMusicEnabled } = useAudioSettings();
  const [on, setOn] = useState(false);
  const [userMuted, setUserMuted] = useState(false);
  const [message, setMessage] = useState("");
  const explained = useRef(false);
  const onRef = useRef(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    onRef.current = on;
  }, [on]);
  useEffect(() => {
    mutedRef.current = userMuted;
  }, [userMuted]);

  const turnOn = useCallback(() => {
    onRef.current = true;
    setOn(true);
    if (!explained.current) {
      explained.current = true;
      setMessage(FIRST_ON_MESSAGE);
    }
  }, []);

  const toggle = useCallback(() => {
    if (onRef.current) {
      onRef.current = false;
      setOn(false);
      setUserMuted(true);
      mutedRef.current = true;
      return;
    }
    setUserMuted(false);
    mutedRef.current = false;
    // The visitor asked for sound, so make sure the music channel can speak.
    if (!settings.musicEnabled) setMusicEnabled(true);
    turnOn();
    playRollSequence(
      [
        { p: 72, t: 0, d: 0.7, v: 0.45 },
        { p: 79, t: 0.3, d: 1, v: 0.4 },
      ],
      { bpm: 120, source: "roll-hello" }
    );
  }, [settings.musicEnabled, setMusicEnabled, turnOn]);

  const want = useCallback(() => {
    if (onRef.current) return true;
    if (mutedRef.current) return false;
    turnOn();
    return true;
  }, [turnOn]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 6000);
    return () => clearTimeout(timer);
  }, [message]);

  const value = useMemo(
    () => ({ on, userMuted, toggle, want, message }),
    [on, userMuted, toggle, want, message]
  );
  return <RollSoundContext.Provider value={value}>{children}</RollSoundContext.Provider>;
}

const SILENT: RollSoundContextValue = {
  on: false,
  userMuted: false,
  toggle: () => {},
  want: () => false,
  message: "",
};

/** Roll sound state. Outside a `RollSoundProvider` the roll is silent. */
export function useRollSound(): RollSoundContextValue {
  return useContext(RollSoundContext) ?? SILENT;
}
