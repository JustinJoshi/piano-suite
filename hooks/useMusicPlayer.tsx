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
import {
  createMidiScheduler,
  createPitchDetector,
  detectFileKind,
  dispatchMusicNoteOff,
  dispatchMusicNoteOn,
  frequencyToNote,
  isSupportedMusicFile,
  parseMidiFile,
  readFileAsArrayBuffer,
  type MusicPlayerFile,
  type MusicPlayerNote,
  type MusicPlayerState,
  type ParsedMusic,
} from "@/lib/music-player";

export type MusicPlayerContextValue = {
  file: MusicPlayerFile | null;
  state: MusicPlayerState;
  isPlaying: boolean;
  duration: number;
  volume: number;
  error: string | null;
  loadFile: (file: File) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
  subscribeProgress: (callback: () => void) => () => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

// Module-level progress ref so the public subscription hook can read the
// current playback position without adding progress to the context value.
// The provider is the only writer; this is safe because MusicPlayerProvider
// is a global singleton mounted in the root layout.
const progressRef = { current: 0 };

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;

  const globalKey = "__pianoSuiteAudioCtx" as const;
  const g = globalThis as unknown as { [globalKey]?: AudioContext };
  if (!g[globalKey]) {
    g[globalKey] = new Ctx();
  }
  return g[globalKey] ?? null;
}

async function ensureAudioContextResumed(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  // Safari reports "interrupted" instead of "suspended".
  const state = ctx.state as string;
  if (state === "suspended" || state === "interrupted") {
    try {
      await ctx.resume();
    } catch {
      // Ignore — user gesture may still be required.
    }
  }
}

/**
 * Global music player provider.
 *
 * Loads MIDI or audio files and dispatches `music-note-on` / `music-note-off`
 * events across the app so both the ripple visualization and the piano sound
 * engine can react. Playback survives route changes.
 */
export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<MusicPlayerFile | null>(null);
  const [parsed, setParsed] = useState<ParsedMusic | null>(null);
  const [state, setState] = useState<MusicPlayerState>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [error, setError] = useState<string | null>(null);

  const progressSubscribersRef = useRef<Set<() => void>>(new Set());
  const volumeRef = useRef(volume);
  const rafRef = useRef<number | null>(null);

  const notifyProgressSubscribers = useCallback(() => {
    progressSubscribersRef.current.forEach((cb) => cb());
  }, []);
  const cancelScheduleRef = useRef<(() => void) | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const progressAtStartRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeNotesRef = useRef<Set<number>>(new Set());
  const detectorRef = useRef<ReturnType<typeof createPitchDetector> | null>(
    null
  );
  const fftBufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const stopAllActiveNotes = useCallback(() => {
    activeNotesRef.current.forEach((note) => {
      dispatchMusicNoteOff(note);
    });
    activeNotesRef.current.clear();
  }, []);

  const cleanupAudioGraph = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch {
        // ignore
      }
      audioSourceRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {
        // ignore
      }
      analyserRef.current = null;
    }
  }, []);

  const disposeAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    cleanupAudioGraph();
  }, [cleanupAudioGraph]);

  const cancelAnimationAndSchedule = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (cancelScheduleRef.current) {
      cancelScheduleRef.current();
      cancelScheduleRef.current = null;
    }
  }, []);

  const loadFile = useCallback(
    async (uploadedFile: File) => {
      if (!isSupportedMusicFile(uploadedFile)) {
        setError(
          "Unsupported file. Please upload a MIDI (.mid/.midi) or audio file (.mp3/.wav/.ogg/.flac/.m4a)."
        );
        setState("error");
        return;
      }

      cancelAnimationAndSchedule();
      stopAllActiveNotes();
      disposeAudio();
      if (file?.src) {
        URL.revokeObjectURL(file.src);
      }
      setIsPlaying(false);
      setError(null);
      setState("loading");
      progressRef.current = 0;
      notifyProgressSubscribers();
      setDuration(0);
      activeNotesRef.current.clear();

      const kind = detectFileKind(uploadedFile);
      const objectUrl = URL.createObjectURL(uploadedFile);

      try {
        if (kind === "midi") {
          const arrayBuffer = await readFileAsArrayBuffer(uploadedFile);
          const parsedMidi = parseMidiFile(arrayBuffer);
          setParsed(parsedMidi);
          setFile({
            name: uploadedFile.name,
            kind: "midi",
            src: objectUrl,
            duration: parsedMidi.duration,
          });
          setDuration(parsedMidi.duration);
          setState("ready");
        } else {
          const audio = new Audio(objectUrl);
          audio.preload = "metadata";
          await new Promise<void>((resolve, reject) => {
            audio.onloadedmetadata = () => resolve();
            audio.onerror = () => reject(new Error("Failed to load audio file"));
          });
          setParsed({ kind: "audio", duration: audio.duration });
          setFile({
            name: uploadedFile.name,
            kind: "audio",
            src: objectUrl,
            duration: audio.duration,
          });
          setDuration(audio.duration);
          audioRef.current = audio;
          setState("ready");
        }
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        setError(err instanceof Error ? err.message : "Failed to load file");
        setState("error");
      }
    },
    [
      cancelAnimationAndSchedule,
      stopAllActiveNotes,
      disposeAudio,
      file,
      notifyProgressSubscribers,
    ]
  );

  const setVolume = useCallback((v: number) => {
    const next = Math.max(0, Math.min(1, v));
    setVolumeState(next);
    if (audioRef.current) {
      audioRef.current.volume = next;
    }
  }, []);

  const play = useCallback(() => {
    if (!parsed || !file) return;
    setIsPlaying(true);
    setState("playing");
  }, [parsed, file]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    setState("paused");
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    progressRef.current = 0;
    notifyProgressSubscribers();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setState("ready");
  }, [notifyProgressSubscribers]);

  // Main playback loop. Runs whenever the user hits play and stays alive until
  // pause, stop, or a new file is loaded.
  useEffect(() => {
    if (!isPlaying || !parsed || !file) return;

    let active = true;
    let rafId: number | null = null;
    let cancelSchedule: (() => void) | null = null;

    const cleanup = () => {
      active = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (cancelSchedule) {
        cancelSchedule();
        cancelSchedule = null;
      }
      stopAllActiveNotes();
      audioRef.current?.pause();
    };

    const analyseAudioFrame = () => {
      const audio = audioRef.current;
      const analyser = analyserRef.current;
      if (!audio || !analyser) return;

      if (!fftBufferRef.current || fftBufferRef.current.length !== analyser.fftSize) {
        fftBufferRef.current = new Float32Array(analyser.fftSize);
      }
      const buffer = fftBufferRef.current;
      analyser.getFloatTimeDomainData(buffer);

      const ctx = getAudioContext();
      if (!ctx || !detectorRef.current) return;

      const frequency = detectorRef.current.detect(buffer);
      const detected = frequency ? frequencyToNote(frequency) : null;

      const activeNotes = activeNotesRef.current;
      if (detected && Math.abs(detected.cents) < 50) {
        const current = [...activeNotes][0] ?? null;
        if (current !== detected.note) {
          activeNotes.forEach((note) => dispatchMusicNoteOff(note));
          activeNotes.clear();
          dispatchMusicNoteOn(
            detected.note,
            Math.round(volumeRef.current * 127)
          );
          activeNotes.add(detected.note);
        }
      } else {
        activeNotes.forEach((note) => dispatchMusicNoteOff(note));
        activeNotes.clear();
      }
    };

    const tick = () => {
      if (!active) return;

      if (parsed.kind === "midi") {
        const ctx = getAudioContext();
        if (ctx && startTimeRef.current !== null) {
          progressRef.current =
            progressAtStartRef.current +
            (ctx.currentTime - startTimeRef.current);
          notifyProgressSubscribers();
        }
        if (progressRef.current >= duration) {
          cleanup();
          setIsPlaying(false);
          setState("ready");
          return;
        }
      } else if (parsed.kind === "audio") {
        const audio = audioRef.current;
        if (audio) {
          progressRef.current = audio.currentTime;
          notifyProgressSubscribers();
          analyseAudioFrame();
          if (audio.ended) {
            cleanup();
            setIsPlaying(false);
            setState("ready");
            return;
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    const start = async () => {
      await ensureAudioContextResumed();
      if (!active) return;

      const ctx = getAudioContext();
      if (!ctx) return;

      if (parsed.kind === "midi") {
        const scheduler = createMidiScheduler(ctx);
        cancelSchedule = () => scheduler.stop();

        progressAtStartRef.current = progressRef.current;
        startTimeRef.current = ctx.currentTime;

        scheduler.schedule(parsed.notes, progressRef.current * 1000, {
          onNoteOn: (note: MusicPlayerNote) => {
            activeNotesRef.current.add(note.note);
          },
          onNoteOff: (note: MusicPlayerNote) => {
            activeNotesRef.current.delete(note.note);
          },
          onComplete: () => {
            if (!active) return;
            cleanup();
            setIsPlaying(false);
            setState("ready");
          },
        });
        rafId = requestAnimationFrame(tick);
      } else if (parsed.kind === "audio") {
        const audio = audioRef.current;
        const ctx = getAudioContext();
        if (audio && ctx) {
          audio.volume = volumeRef.current;
          if (!audioSourceRef.current) {
            const source = ctx.createMediaElementSource(audio);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 2048;
            source.connect(analyser);
            analyser.connect(ctx.destination);
            audioSourceRef.current = source;
            analyserRef.current = analyser;
            detectorRef.current = createPitchDetector(ctx.sampleRate);
          }
          audio.currentTime = progressRef.current;
          try {
            await audio.play();
            if (!active) {
              audio.pause();
              return;
            }
            rafId = requestAnimationFrame(tick);
          } catch {
            // Ignore playback errors (e.g. user gesture required).
          }
        }
      }
    };

    start();
    return cleanup;
  }, [
    isPlaying,
    parsed,
    file,
    duration,
    stopAllActiveNotes,
    notifyProgressSubscribers,
  ]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      cancelAnimationAndSchedule();
      stopAllActiveNotes();
      disposeAudio();
      if (file?.src) {
        URL.revokeObjectURL(file.src);
      }
    };
  }, [cancelAnimationAndSchedule, stopAllActiveNotes, disposeAudio, file?.src]);

  const subscribeProgress = useCallback((callback: () => void) => {
    progressSubscribersRef.current.add(callback);
    return () => {
      progressSubscribersRef.current.delete(callback);
    };
  }, []);

  const value: MusicPlayerContextValue = useMemo(
    () => ({
      file,
      state,
      isPlaying,
      duration,
      volume,
      error,
      loadFile,
      play,
      pause,
      stop,
      setVolume,
      subscribeProgress,
    }),
    [
      file,
      state,
      isPlaying,
      duration,
      volume,
      error,
      loadFile,
      play,
      pause,
      stop,
      setVolume,
      subscribeProgress,
    ]
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer(): MusicPlayerContextValue {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) {
    throw new Error(
      "useMusicPlayer must be used within MusicPlayerProvider"
    );
  }
  return ctx;
}

/**
 * Subscribe to the music player's playback progress.
 *
 * Returns the current progress in seconds and re-renders the caller on every
 * animation frame while playing, without re-rendering other context consumers.
 */
export function useMusicPlayerProgress(): number {
  const { subscribeProgress } = useMusicPlayer();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return subscribeProgress(() => {
      setProgress(progressRef.current);
    });
  }, [subscribeProgress]);

  return progress;
}
